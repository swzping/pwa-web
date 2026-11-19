const getBaseConfigurableOptionGroups = productData => {
    return (productData?.configurable_options || [])
        .filter(option => option?.values?.length)
        .map(option => ({
            id: option.attribute_code || option.uid || option.label,
            attributeCode: option.attribute_code,
            label: option.label,
            values: option.values.map(value => ({ ...value })),
            attributeId: option.attribute_id,
        }));
};

const isVariantSaleable = variant => {
    const product = variant?.product || variant;
    const salableQty = product?.stock_item?.salable_qty;

    return (
        !!product &&
        product.stock_status === 'IN_STOCK' &&
        product?.stock_item?.is_in_stock !== false &&
        (salableQty === undefined || salableQty === null || Number(salableQty) > 0)
    );
};

const isOptionOutOfStock = value => {
    const stockStatus = value.stock_status || value.stockStatus;

    return stockStatus === 'OUT_OF_STOCK' || value.is_available === false || value.is_salable === false;
};

const getVariantOptionUids = (productData, variant) => {
    const optionGroups = getBaseConfigurableOptionGroups(productData);

    return (variant?.attributes || [])
        .map(attribute => {
            if (attribute.uid) {
                return attribute.uid;
            }

            const optionGroup = optionGroups.find(group => group.attributeCode === attribute.code);
            const value = optionGroup?.values.find(
                optionValue => String(optionValue.value_index) === String(attribute.value_index),
            );

            return value?.uid;
        })
        .filter(Boolean);
};

const getSelectedOptionUids = (optionGroups, selectedOptions) => {
    return optionGroups.map(group => selectedOptions[group.id]).filter(Boolean);
};

const getInitialSelectedOptionsFromOptionUids = (optionGroups, selectedOptionUids = []) => {
    if (!optionGroups.length || !Array.isArray(selectedOptionUids) || !selectedOptionUids.length) {
        return {};
    }

    const selectedOptionUidSet = new Set(selectedOptionUids.filter(Boolean));

    return optionGroups.reduce((selectedOptions, group) => {
        const selectedValue = group.values.find(value => selectedOptionUidSet.has(value.uid));

        if (selectedValue) {
            selectedOptions[group.id] = selectedValue.uid;
        }

        return selectedOptions;
    }, {});
};

const getSelectedOptionsSignature = (selectedOptions = {}) =>
    Object.keys(selectedOptions)
        .sort()
        .map(key => `${key}:${selectedOptions[key]}`)
        .join('|');

const getInitialSelectedOptionsFromCartItems = (productData, cartItems = []) => {
    const optionGroups = getBaseConfigurableOptionGroups(productData);

    if (!optionGroups.length) {
        return {};
    }

    const hasMatchingOptionValues = item => {
        if (!Array.isArray(item?.configurable_options) || !item.configurable_options.length) {
            return false;
        }

        const optionValueUids = new Set(
            item.configurable_options
                .map(option => option?.configurable_product_option_value_uid || option?.value_uid || option?.value_id)
                .filter(Boolean),
        );

        return optionGroups.every(group => group.values.some(value => optionValueUids.has(value.uid)));
    };

    const matchingCartItem = cartItems.find(
        item => item?.product?.sku === productData?.sku && Number(item?.quantity) > 0 && hasMatchingOptionValues(item),
    );

    if (!matchingCartItem) {
        return {};
    }

    const selectedOptionUidSet = new Set(
        matchingCartItem.configurable_options
            .map(option => option?.configurable_product_option_value_uid || option?.value_uid || option?.value_id)
            .filter(Boolean),
    );

    return optionGroups.reduce((selectedOptions, group) => {
        const selectedValue = group.values.find(value => selectedOptionUidSet.has(value.uid));

        if (selectedValue) {
            selectedOptions[group.id] = selectedValue.uid;
        }

        return selectedOptions;
    }, {});
};

const getSelectedConfigurableVariant = (productData, selectedOptionUids) => {
    const optionGroups = getBaseConfigurableOptionGroups(productData);
    const requiredOptionCount = optionGroups.length;

    if (!requiredOptionCount || !selectedOptionUids || selectedOptionUids.length < requiredOptionCount) {
        return null;
    }

    const matchedVariant = (productData?.variants || []).find(variant => {
        const variantUidSet = new Set(getVariantOptionUids(productData, variant));

        return selectedOptionUids.every(uid => variantUidSet.has(uid));
    });

    if (!matchedVariant) {
        return null;
    }

    return matchedVariant.product;
};

const getLocalAvailabilityMap = (productData, selectedOptions = {}) => {
    const optionGroups = getBaseConfigurableOptionGroups(productData);
    const variants = productData?.variants || [];

    if (!optionGroups.length || !variants.length) {
        return {};
    }

    return optionGroups.reduce((availabilityMap, group) => {
        group.values.forEach(value => {
            const otherSelectedUids = optionGroups
                .filter(optionGroup => optionGroup.id !== group.id)
                .map(optionGroup => selectedOptions[optionGroup.id])
                .filter(Boolean);
            const candidateUids = [...otherSelectedUids, value.uid].filter(Boolean);

            const matchingVariants = variants.filter(variant => {
                const variantUidSet = new Set(getVariantOptionUids(productData, variant));

                return candidateUids.every(uid => variantUidSet.has(uid));
            });

            if (!matchingVariants.length) {
                return;
            }

            availabilityMap[value.uid] = matchingVariants.some(isVariantSaleable);
        });

        return availabilityMap;
    }, {});
};

const getOptionAvailability = ({
    isSelectedVariantUnavailable,
    localAvailabilityMap,
    option,
    selectedOptions,
    value,
}) => {
    if (isSelectedVariantUnavailable && selectedOptions[option.id] === value.uid) {
        return false;
    }

    if (Object.prototype.hasOwnProperty.call(localAvailabilityMap, value.uid)) {
        return localAvailabilityMap[value.uid];
    }

    return value.is_available;
};

const getConfigurableOptionGroups = (productData, selectedOptions = {}) => {
    const localAvailabilityMap = getLocalAvailabilityMap(productData, selectedOptions);
    const hasLocalAvailability = Object.keys(localAvailabilityMap).length > 0;
    const baseGroups = getBaseConfigurableOptionGroups(productData);
    const selectedOptionUids = getSelectedOptionUids(baseGroups, selectedOptions);
    const selectedVariant = getSelectedConfigurableVariant(productData, selectedOptionUids);
    const isSelectedVariantUnavailable = !!selectedVariant && !isVariantSaleable(selectedVariant);

    if (!hasLocalAvailability && !isSelectedVariantUnavailable) {
        return baseGroups;
    }

    return baseGroups.map(option => ({
        ...option,
        values: option.values
            .filter(value => {
                const hasGroupAvailability = option.values.some(optionValue =>
                    Object.prototype.hasOwnProperty.call(localAvailabilityMap, optionValue.uid),
                );

                return !hasGroupAvailability || Object.prototype.hasOwnProperty.call(localAvailabilityMap, value.uid);
            })
            .map(value => ({
                ...value,
                is_available: getOptionAvailability({
                    isSelectedVariantUnavailable,
                    localAvailabilityMap,
                    option,
                    selectedOptions,
                    value,
                }),
            })),
    }));
};

const getNextSelectedOptions = (selectedOptions, groupId, valueId) => {
    if (selectedOptions[groupId] === valueId) {
        const nextOptions = { ...selectedOptions };
        delete nextOptions[groupId];

        return nextOptions;
    }

    return {
        ...selectedOptions,
        [groupId]: valueId,
    };
};

const getIsConfigurableSelectionSaleable = (productData, selectedOptionUids) => {
    const selectedVariant = getSelectedConfigurableVariant(productData, selectedOptionUids);

    return !!selectedVariant && isVariantSaleable(selectedVariant);
};

const getIsPdpCartActionDisabled = ({ isBaseDisabled, isConfigurable, isSelectionSaleable }) => {
    if (isConfigurable) {
        return !isSelectionSaleable;
    }

    return !!isBaseDisabled;
};

const getVariantMediaGalleryEntries = variant => {
    const mediaGalleryEntries = variant?.media_gallery_entries || [];

    if (mediaGalleryEntries.length) {
        return mediaGalleryEntries;
    }

    const imageUrl = variant?.small_image?.url || variant?.thumbnail?.url;

    return imageUrl
        ? [
              {
                  id: `variant-${variant.uid || variant.sku || imageUrl}`,
                  label: variant.name || '',
                  position: 1,
                  disabled: false,
                  file: imageUrl,
              },
          ]
        : [];
};

const getConfigurableDisplayDetails = ({ mediaGalleryEntries, productDetails, selectedVariant }) => {
    const variantMediaGalleryEntries = getVariantMediaGalleryEntries(selectedVariant);
    const selectedPriceRange = selectedVariant?.price_range;

    return {
        discountPercent: selectedPriceRange?.maximum_price?.discount?.percent_off || productDetails?.discount,
        finalPriceValue:
            selectedPriceRange?.maximum_price?.final_price?.value ||
            productDetails?.priceRange?.minimum_price?.final_price?.value ||
            productDetails?.specialPrice,
        mediaGalleryEntries: variantMediaGalleryEntries.length ? variantMediaGalleryEntries : mediaGalleryEntries,
        priceCurrency: selectedPriceRange?.maximum_price?.final_price?.currency || productDetails?.price?.currency,
        regularPriceValue:
            selectedPriceRange?.maximum_price?.regular_price?.value ||
            productDetails?.priceRange?.minimum_price?.regular_price?.value ||
            productDetails?.price?.value,
    };
};

const getOptionValueId = value => value.uid || value.value_index || value.label;

const getOptionLabel = value => value.label || value.store_label || value.default_label;

const getSwatchContent = (group, value) => {
    const swatchData = value?.swatch_data;

    if (group.attributeCode !== 'oms_variant' || !swatchData) {
        return null;
    }

    if (swatchData.__typename === 'ImageSwatchData' && swatchData.thumbnail) {
        return {
            type: 'image',
            value: swatchData.thumbnail,
        };
    }

    if (swatchData.__typename === 'ColorSwatchData' && swatchData.value) {
        return {
            type: 'color',
            value: swatchData.value,
        };
    }

    if (swatchData.__typename === 'TextSwatchData' && swatchData.value) {
        return {
            type: 'text',
            value: swatchData.value,
        };
    }

    return null;
};

const getOptionStockLabel = value => {
    const stockStatus = value.stock_status || value.stockStatus;

    if (isOptionOutOfStock(value)) {
        return null;
    }

    if (value.badge) {
        return value.badge;
    }

    return stockStatus === 'LOW_STOCK' ? 'Low Stock' : null;
};

const getOptionValuePresentation = (group, value) => {
    const isUnavailable = isOptionOutOfStock(value);
    const stockLabel = getOptionStockLabel(value);

    return {
        isDisabled: value.disabled === true,
        isUnavailable,
        label: getOptionLabel(value),
        stockLabel,
        swatchContent: getSwatchContent(group, value),
        valueId: getOptionValueId(value),
    };
};

export {
    getConfigurableDisplayDetails,
    getConfigurableOptionGroups,
    getInitialSelectedOptionsFromCartItems,
    getInitialSelectedOptionsFromOptionUids,
    getIsConfigurableSelectionSaleable,
    getIsPdpCartActionDisabled,
    getNextSelectedOptions,
    getOptionValueId,
    getOptionValuePresentation,
    getSelectedConfigurableVariant,
    getSelectedOptionUids,
    getSelectedOptionsSignature,
    getVariantMediaGalleryEntries,
};
