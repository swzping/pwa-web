import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';

import { useToasts } from '@magento/peregrine';
import { appendOptionsToPayload } from '@magento/peregrine/lib/util/appendOptionsToPayload';
import { findMatchingVariant } from '@magento/peregrine/lib/util/findMatchingProductVariant';
import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
// import defaultOperations from '@magento/peregrine/lib/talons/ProductFullDetail/productFullDetail.gql';
import defaultOperations from './productFullDetail.gql';

import { addToCartTracking } from '../../../../lib/ThirdPartyTracking';
import Price from '@magento/venia-ui/lib/components/Price';

const INITIAL_OPTION_CODES = new Map();
const INITIAL_OPTION_SELECTIONS = new Map();

const deriveOptionCodesFromProduct = product => {
    // If this is a simple product it has no option codes.
    if (!isProductConfigurable(product)) {
        return INITIAL_OPTION_CODES;
    }

    // Initialize optionCodes based on the options of the product.
    const initialOptionCodes = new Map();
    for (const {
        attribute_id,
        attribute_code
    } of product.configurable_options) {
        initialOptionCodes.set(attribute_id, attribute_code);
    }

    return initialOptionCodes;
};

// Similar to deriving the initial codes for each option.
const deriveOptionSelectionsFromProduct = product => {
    if (!isProductConfigurable(product)) {
        return INITIAL_OPTION_SELECTIONS;
    }

    const initialOptionSelections = new Map();
    for (const { attribute_id } of product.configurable_options) {
        initialOptionSelections.set(attribute_id, undefined);
    }

    return initialOptionSelections;
};

const getIsMissingOptions = (product, optionSelections) => {
    // Non-configurable products can't be missing options.
    if (!isProductConfigurable(product)) {
        return false;
    }

    // Configurable products are missing options if we have fewer
    // option selections than the product has options.
    const { configurable_options } = product;
    const numProductOptions = configurable_options.length;
    const numProductSelections = Array.from(optionSelections.values()).filter(
        value => !!value
    ).length;

    return numProductSelections < numProductOptions;
};

const getMediaGalleryEntries = (product, optionCodes, optionSelections) => {
    let value = [];

    const { media_gallery_entries, variants } = product;
    const isConfigurable = isProductConfigurable(product);

    // Selections are initialized to "code => undefined". Once we select a value, like color, the selections change. This filters out unselected options.
    const optionsSelected =
        Array.from(optionSelections.values()).filter(value => !!value).length >
        0;

    if (!isConfigurable || !optionsSelected) {
        value = media_gallery_entries;
    } else {
        // If any of the possible variants matches the selection add that
        // variant's image to the media gallery. NOTE: This _can_, and does,
        // include variants such as size. If Magento is configured to display
        // an image for a size attribute, it will render that image.
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? [...item.product.media_gallery_entries, ...media_gallery_entries]
            : media_gallery_entries;
    }

    return value;
};

// We only want to display breadcrumbs for one category on a PDP even if a
// product has multiple related categories. This function filters and selects
// one category id for that purpose.
const getBreadcrumbCategoryId = categories => {
    // Exit if there are no categories for this product.
    if (!categories || !categories.length) {
        return;
    }
    const breadcrumbSet = new Set();
    categories.forEach(({ breadcrumbs }) => {
        // breadcrumbs can be `null`...
        (breadcrumbs || []).forEach(({ category_uid }) =>
            breadcrumbSet.add(category_uid)
        );
    });

    // Until we can get the single canonical breadcrumb path to a product we
    // will just return the first category id of the potential leaf categories.
    const leafCategory = categories.find(
        category => !breadcrumbSet.has(category.uid)
    );

    // If we couldn't find a leaf category then just use the first category
    // in the list for this product.
    return leafCategory.uid || categories[0].uid;
};

const getConfigPrice = (product, optionCodes, optionSelections) => {
    let value;

    const { variants } = product;
    const isConfigurable = isProductConfigurable(product);

    const optionsSelected =
        Array.from(optionSelections.values()).filter(value => !!value).length >
        0;

    if (!isConfigurable || !optionsSelected) {
        value = product.price.regularPrice.amount;
    } else {
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? item.product.price.regularPrice.amount
            : product.price.regularPrice.amount;
    }

    return value;
};

// bundle item option selection
const changeSelectedOption = (position, id, items) => {
    const result = [];
    for (let index = 0; index < items.length; index++) {
        // need to create new object because read only from graph ql
        const element = { ...items[index] };
        const optionArr = [];
        if (element.position === parseInt(position)) {
            for (let idx = 0; idx < element.options.length; idx++) {
                const opt = { ...element.options[idx] };
                if (element.type === 'radio' || element.type === 'select') {
                    opt.is_default = opt.id === parseInt(id);
                } else if (
                    (element.type === 'checkbox' || element.type === 'multi') &&
                    opt.id === parseInt(id)
                ) {
                    opt.is_default = !opt.is_default;
                }
                optionArr.push(opt);
            }
            element.options = optionArr;
        }
        result.push(element);
    }
    return result;
};

// customizable bundle price
const generateBundlePrice = items => {
    let price = 0;
    let currency = 'USD';
    for (let index = 0; index < items.length; index++) {
        const element = items[index];
        const qty = element.qty ? element.qty : 1;
        for (let idx = 0; idx < element.options.length; idx++) {
            const opt = element.options[idx];
            currency =
                opt.product.price_range.minimum_price.final_price.currency;
            if (opt.is_default) {
                price +=
                    opt.quantity *
                    opt.product.price_range.minimum_price.final_price.value *
                    qty;
            }
        }
    }

    return <Price currencyCode={currency} value={price} />;
};

const SUPPORTED_PRODUCT_TYPES = [
    'SimpleProduct',
    'ConfigurableProduct',
    'DownloadableProduct',
    'VirtualProduct',
    'BundleProduct'
];

/**
 * @param {GraphQLDocument} props.addConfigurableProductToCartMutation - configurable product mutation
 * @param {GraphQLDocument} props.addSimpleProductToCartMutation - configurable product mutation
 * @param {Object.<string, GraphQLDocument>} props.operations - collection of operation overrides merged into defaults
 * @param {Object} props.product - the product, see RootComponents/Product
 *
 * @returns {{
 *  breadcrumbCategoryId: string|undefined,
 *  errorMessage: string|undefined,
 *  handleAddToCart: func,
 *  handleSelectionChange: func,
 *  handleSetQuantity: func,
 *  isAddToCartDisabled: boolean,
 *  isSupportedProductType: boolean,
 *  mediaGalleryEntries: array,
 *  productDetails: object,
 *  quantity: number
 * }}
 */
export const useProductFullDetail = props => {
    const {
        addConfigurableProductToCartMutation,
        addSimpleProductToCartMutation,
        addDownloadableProductToCartMutation,
        addVirtualProductToCartMutation,
        addBundleProductToCartMutation,
        product
    } = props;

    const hasDeprecatedOperationProp = !!(
        addConfigurableProductToCartMutation || addSimpleProductToCartMutation
    );

    const operations = mergeOperations(defaultOperations, props.operations);

    const productType = product.__typename;

    // bundle item options
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (items.length === 0 && product && productType === 'BundleProduct') {
            setItems([...product.items]);
        }
    }, [product]);

    // Customizable Options
    const [selectedValue, setSelectedValue] = useState(null);
    const [selectedDropdown, setSelectedDropdown] = useState('');
    const [selectedRadio, setSelectedRadio] = useState('');
    const [selectedCheckbox, setSelectedCheckbox] = useState('');
    const [selectedMultipleValue, setSelectedMultipleValue] = useState(null);
    const [selectedMultiple, setSelectedMultiple] = useState([]);
    const [isRequired, setRequired] = useState(false);

    const handleDropdownChange = useCallback(
        value => {
            setSelectedDropdown(value ? value.uid : '');
            setSelectedValue(value);
        },
        [setSelectedDropdown, setSelectedValue]
    );

    const handleRadioChange = useCallback(
        e => {
            setSelectedRadio(e.target.value);
        },
        [setSelectedRadio]
    );

    const handleCheckboxChange = useCallback(
        e => {
            setSelectedCheckbox(e.target.value);
        },
        [setSelectedCheckbox]
    );

    const handleMultipleChange = useCallback(
        e => {
            setSelectedMultiple(Array.isArray(e) ? e.map(x => x.uid) : []);

            setSelectedMultipleValue(e);
        },
        [setSelectedMultiple, setSelectedMultipleValue]
    );

    const isSupportedProductType = SUPPORTED_PRODUCT_TYPES.includes(
        productType
    );

    const [
        { cartId },
        {
            actions: { updateCartObsolete }
        }
    ] = useCartContext();
    const [{ isSignedIn }] = useUserContext();
    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();

    const { data: storeConfigData } = useQuery(
        operations.getWishlistConfigQuery,
        {
            fetchPolicy: 'cache-and-network'
        }
    );

    const [
        addConfigurableProductToCart,
        {
            error: errorAddingConfigurableProduct,
            loading: isAddConfigurableLoading
        }
    ] = useMutation(
        addConfigurableProductToCartMutation ||
            operations.addConfigurableProductToCartMutation
    );

    const [
        addSimpleProductToCart,
        { error: errorAddingSimpleProduct, loading: isAddSimpleLoading }
    ] = useMutation(
        addSimpleProductToCartMutation ||
            operations.addSimpleProductToCartMutation
    );

    const [
        addDownloadableProductToCart,
        {
            error: errorAddingDownloadableProduct,
            loading: isAddDownloadableLoading
        }
    ] = useMutation(
        addDownloadableProductToCartMutation ||
            operations.addDownloadableProductToCartMutation
    );

    const [
        addVirtualProductToCart,
        { error: errorAddingVirtualProduct, loading: isAddVirtualLoading }
    ] = useMutation(
        addVirtualProductToCartMutation ||
            operations.addVirtualProductToCartMutation
    );

    const [
        addBundleProductToCart,
        { error: errorAddingBundleProduct, loading: isAddBundleLoading }
    ] = useMutation(
        addBundleProductToCartMutation ||
            operations.addBundleProductToCartMutation
    );

    const [
        addProductToCart,
        {
            data: addProductData,
            error: errorAddingProductToCart,
            loading: isAddProductLoading
        }
    ] = useMutation(operations.addProductToCartMutation);

    const [getCustomerData, { data: dataCustomer }] = useLazyQuery(defaultOperations.getEmailCustomer, {
        fetchPolicy: 'cache-and-network',
        skip: !isSignedIn
    });

    const breadcrumbCategoryId = useMemo(
        () => getBreadcrumbCategoryId(product.categories),
        [product.categories]
    );

    const derivedOptionSelections = useMemo(
        () => deriveOptionSelectionsFromProduct(product),
        [product]
    );

    const [optionSelections, setOptionSelections] = useState(
        derivedOptionSelections
    );

    const derivedOptionCodes = useMemo(
        () => deriveOptionCodesFromProduct(product),
        [product]
    );
    const [optionCodes] = useState(derivedOptionCodes);

    const isMissingOptions = useMemo(
        () => getIsMissingOptions(product, optionSelections),
        [product, optionSelections]
    );
    const mediaGalleryEntries = useMemo(
        () => getMediaGalleryEntries(product, optionCodes, optionSelections),
        [product, optionCodes, optionSelections]
    );

    // The map of ids to values (and their uids)
    // For example:
    // { "179" => [{ uid: "abc", value_index: 1 }, { uid: "def", value_index: 2 }]}
    const attributeIdToValuesMap = useMemo(() => {
        const map = new Map();
        // For simple items, this will be an empty map.
        const options = product.configurable_options || [];
        for (const { attribute_id, values } of options) {
            map.set(attribute_id, values);
        }
        return map;
    }, [product.configurable_options]);

    // An array of selected option uids. Useful for passing to mutations.
    // For example:
    // ["abc", "def"]
    const selectedOptionsArray = useMemo(() => {
        const selectedOptions = [];

        optionSelections.forEach((value, key) => {
            const values = attributeIdToValuesMap.get(key);

            const selectedValue = values.find(
                item => item.value_index === value
            );

            if (selectedValue) {
                selectedOptions.push(selectedValue.uid);
            }
        });
        return selectedOptions;
    }, [attributeIdToValuesMap, optionSelections]);

    const selectedCustomizableOptionsArray = useMemo(() => {
        const selectedOptions = [];
        selectedOptions.push(
            selectedDropdown,
            selectedRadio,
            selectedCheckbox,
            ...selectedMultiple
        );

        return selectedOptions;
    }, [selectedDropdown, selectedRadio, selectedCheckbox, selectedMultiple]);

    const handleAddToCart = useCallback(
        async formValues => {
            const {
                quantity,
                sku: overrideSku,
                selectedOptions: overrideSelectedOptions
            } = formValues;

            // Tracks whether the add-to-cart mutation actually succeeded so
            // callers (e.g. the "Buy Now" button) can decide whether to
            // proceed to checkout.
            let addToCartSuccess = false;
            let successMessage = null;
            let errorMessage = null;

            /*
                @deprecated in favor of general addProductsToCart mutation. Will support until the next MAJOR.
             */
            if (hasDeprecatedOperationProp) {
                const payload = {
                    item: product,
                    productType,
                    quantity
                };

                if (isProductConfigurable(product)) {
                    appendOptionsToPayload(
                        payload,
                        optionSelections,
                        optionCodes
                    );
                }

                if (isSupportedProductType) {
                    const variables = {
                        cartId,
                        parentSku: payload.parentSku,
                        product: payload.item,
                        quantity: payload.quantity,
                        sku: payload.item.sku
                    };
                    // Use the proper mutation for the type.
                    if (productType === 'SimpleProduct') {
                        try {
                            await addSimpleProductToCart({
                                variables
                            });
                            addToCartSuccess = true;
                        } catch (error) {
                            return {
                                success: false,
                                errorMessage: deriveErrorMessage([error])
                            };
                        }
                    } else if (productType === 'ConfigurableProduct') {
                        try {
                            await addConfigurableProductToCart({
                                variables
                            });
                            addToCartSuccess = true;
                        } catch (error) {
                            return {
                                success: false,
                                errorMessage: deriveErrorMessage([error])
                            };
                        }
                    } else if (productType === 'DownloadableProduct') {
                        try {
                            await addDownloadableProductToCart({
                                variables
                            });
                            addToCartSuccess = true;
                        } catch (error) {
                            return {
                                success: false,
                                errorMessage: deriveErrorMessage([error])
                            };
                        }
                    }
                } else if (productType === 'VirtualProduct') {
                    try {
                        await addVirtualProductToCart({
                            variables
                        });
                        addToCartSuccess = true;
                    } catch (error) {
                        return {
                            success: false,
                            errorMessage: deriveErrorMessage([error])
                        };
                    }
                } else {
                    console.error(
                        'Unsupported product type. Cannot add to cart.'
                    );
                }
            } else {
                const variables = {
                    cartId,
                    product: {
                        // 注意：必须用父级 sku（含 ConfigurableProduct），
                        // addProductsToCart 不认 variant 子 sku。
                        sku: overrideSku || product.sku,
                        quantity
                    },
                };

                if (productType === 'BundleProduct') {
                    const options = [];
                    for (let index = 0; index < items.length; index++) {
                        const element = items[index];
                        const value = [];
                        for (let idx = 0; idx < element.options.length; idx++) {
                            const opt = element.options[idx];
                            if (opt.is_default) {
                                value.push(opt.id.toString());
                            }
                        }
                        options.push({
                            id: element.option_id,
                            quantity: element.qty || 1,
                            value
                        });
                    }

                    const bundleData = {
                        sku: product.sku,
                        quantity
                    };
                    try {
                        await addBundleProductToCart({
                            variables: {
                                cartId,
                                data: bundleData,
                                bundleOptions: options
                            }
                        });
                        addToCartSuccess = true;
                    } catch (error) {
                        return {
                            success: false,
                            errorMessage: deriveErrorMessage([error])
                        };
                    }
                } else {
                    if (overrideSelectedOptions?.length) {
                        variables.product.selected_options =
                            overrideSelectedOptions;
                    } else if (selectedOptionsArray.length) {
                        variables.product.selected_options = selectedOptionsArray;
                    } else if (selectedCustomizableOptionsArray.length) {
                        // Add to cart customizable options
                        variables.product.selected_options = selectedCustomizableOptionsArray;
                    }
    
                    try {
                        const result = await addProductToCart({ variables });

                        const userErrors =
                            result?.data?.addProductsToCart?.user_errors;
                        const toastrMessage =
                            result?.data?.addProductsToCart?.toastr_message;

                        // The mutation may resolve successfully while the
                        // server still reports errors (e.g. qty limit).
                        if (userErrors && userErrors.length > 0) {
                            return {
                                success: false,
                                errorMessage: userErrors[0].message
                            };
                        }

                        addToCartSuccess = true;
                        successMessage =
                            toastrMessage && toastrMessage.status === true
                                ? toastrMessage.message
                                : null;

                        // Required select customizable options
                        if (
                            selectedValue === null ||
                            selectedCheckbox === '' ||
                            selectedRadio === '' ||
                            selectedMultipleValue === null
                        ) {
                            setRequired(true);
                        }
                    } catch (error) {
                        return {
                            success: false,
                            errorMessage: deriveErrorMessage([error])
                        };
                    }
                }
            }

            addToCartTracking(product, quantity);

            return { success: addToCartSuccess, successMessage, errorMessage };
        },
        [
            addConfigurableProductToCart,
            addProductToCart,
            addSimpleProductToCart,
            addDownloadableProductToCart,
            addVirtualProductToCart,
            addBundleProductToCart,
            cartId,
            hasDeprecatedOperationProp,
            isSupportedProductType,
            optionCodes,
            optionSelections,
            product,
            productType,
            selectedOptionsArray,
            selectedCustomizableOptionsArray,
            selectedValue,
            selectedCheckbox,
            selectedRadio,
            selectedMultipleValue,
            items
        ]
    );

    const handleSelectionChange = useCallback(
        (optionId, selection) => {
            // We must create a new Map here so that React knows that the value
            // of optionSelections has changed.
            const nextOptionSelections = new Map([...optionSelections]);
            nextOptionSelections.set(optionId, selection);
            setOptionSelections(nextOptionSelections);
        },
        [optionSelections]
    );

    const productPrice = useMemo(
        () => getConfigPrice(product, optionCodes, optionSelections),
        [product, optionCodes, optionSelections]
    );

    const brandFilter = product.more_info.filter(
        item => item.label === 'Brand'
    );
    // Normalization object for product details we need for rendering.
    const productDetails = {
        id: product.id,
        description: product.description,
        brand:
            product.more_info.length > 0 && brandFilter.length > 0
                ? brandFilter[0].value
                : null,
        howToUse: product.how_to_use,
        name: product.name,
        price: productPrice,
        sku: product.sku,
        rating: product.review.rating_summary,
        reviews: product.review.reviews_count,
        specialPrice: product.special_price,
        discount: product.price_range.maximum_price.discount.percent_off,
        relatedProducts: product.related_products,
        sale: product.sale,
        promo: product.promo,
        priceRange: product.price_range,
        stockStatus: product.stock_status,
        offers: product.offers,
    };

    const derivedErrorMessage = useMemo(
        () =>
            deriveErrorMessage([
                errorAddingSimpleProduct,
                errorAddingConfigurableProduct,
                errorAddingProductToCart,
                errorAddingDownloadableProduct,
                errorAddingVirtualProduct,
                errorAddingBundleProduct
            ]),
        [
            errorAddingConfigurableProduct,
            errorAddingProductToCart,
            errorAddingSimpleProduct,
            errorAddingDownloadableProduct,
            errorAddingVirtualProduct,
            errorAddingBundleProduct
        ]
    );

    const wishlistItemOptions = useMemo(() => {
        const options = {
            quantity: 1,
            ...product
        };

        if (productType === 'ConfigurableProduct') {
            options.selected_options = selectedOptionsArray;
        }

        return options;
    }, [product, productType, selectedOptionsArray]);

    const wishlistButtonProps = {
        buttonText: isSelected =>
            isSelected
                ? formatMessage({
                      id: 'wishlistButton.addedText1',
                      defaultMessage: 'Saved to Wishlist'
                  })
                : formatMessage({
                      id: 'wishlistButton.addText1',
                      defaultMessage: 'Save to Wishlist'
                  }),
        item: wishlistItemOptions,
        quantity: wishlistItemOptions.quantity,
        storeConfig: storeConfigData ? storeConfigData.storeConfig : {}
    };

    const selectOptions = (group, id) => {
        const itemsUpdate = changeSelectedOption(group.position, id, items);
        setItems([...itemsUpdate]);
    };

    // message success or failed at add product to cart
    useEffect(() => {
        if (addProductData) {
            if (
                addProductData.addProductsToCart.toastr_message.status === true
            ) {
                addToast({
                    type: 'info',
                    message:
                        addProductData.addProductsToCart.toastr_message.message,
                    timeout: 5000
                });

                updateCartObsolete(true);
            } else if (
                addProductData.addProductsToCart.toastr_message.status === false
            ) {
                addToast({
                    type: 'error',
                    message:
                        addProductData.addProductsToCart.toastr_message.message,
                    timeout: 5000
                });
            }
        }
    }, [addToast, addProductData]);

    useEffect(() => {
        if (isSignedIn) getCustomerData();
    }, [isSignedIn]);

    const errorQtyMessage = useMemo(() => {
        if (addProductData) {
            if (addProductData.addProductsToCart.user_errors[0]) {
                return addProductData.addProductsToCart.user_errors[0].message;
            } else {
                return null;
            }
        }
    }, [addProductData]);

    // The concrete SKU that would be added to the cart (the variant SKU once
    // a configurable product's options have been selected). Used by "Buy Now"
    // to check whether this product is already in the cart.
    const currentSku = useMemo(() => {
        if (productType === 'ConfigurableProduct') {
            try {
                return getVariantSku();
            } catch {
                return product.sku;
            }
        }

        return product.sku;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productType, product.sku, selectedOptionsArray]);

    return {
        breadcrumbCategoryId,
        errorMessage: derivedErrorMessage,
        addProductData,
        errorQtyMessage,
        currentSku,
        handleAddToCart,
        handleSelectionChange,
        isAddToCartDisabled:
            isMissingOptions ||
            isAddConfigurableLoading ||
            isAddSimpleLoading ||
            isAddProductLoading ||
            isAddDownloadableLoading ||
            isAddVirtualLoading ||
            isAddBundleLoading,
        isSupportedProductType,
        mediaGalleryEntries,
        shouldShowWishlistButton:
            isSignedIn &&
            storeConfigData &&
            !!storeConfigData.storeConfig.magento_wishlist_general_is_enabled,
        productDetails,
        handleDropdownChange,
        handleRadioChange,
        handleCheckboxChange,
        handleMultipleChange,
        selectedValue,
        selectedMultipleValue,
        selectedRadio,
        selectedCheckbox,
        isRequired,
        wishlistButtonProps,
        wishlistItemOptions,
        items,
        selectOptions,
        generateBundlePrice,
        dataCustomer
    };
};
