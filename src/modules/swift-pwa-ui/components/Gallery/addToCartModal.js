import React, { useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { createPortal } from 'react-dom';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import Price from '@magento/venia-ui/lib/components/Price';
import {
    getConfigurableOptionGroups,
    getIsConfigurableSelectionSaleable,
    getNextSelectedOptions,
    getOptionValuePresentation,
    getSelectedConfigurableVariant,
    getSelectedOptionUids,
} from '../../../../overrides/venia-ui/components/ProductFullDetail/productOptions';
import productOperations from '../../../../overrides/peregrine/talons/RootComponents/Product/product.gql';
import { useProductNotifyMe } from '../../../peregrine/talons/ProductNotifyMe/useProductNotifyMe';
import { getProductImageUrl, getSelectedOptionSwatchImage } from './addToCartModal.helpers';
import { getModalOptionState } from './addToCartModal.options';
import { getFlashSaleCountdown, getFlashSaleOptionUids } from './addToCartModal.flashSale';
import { CountdownDisplay } from '../../../../overrides/venia-ui/components/ProductFullDetail/countDown';

import classes from './addToCartModal.module.css';

const FALLBACK_OPTION_GROUPS = [
    {
        id: 'size',
        label: 'Size',
        values: Array.from({ length: 5 }).map((_, index) => ({
            label: 'Size One',
            value_index: `size-${index}`,
        })),
    },
    {
        id: 'color',
        label: 'Color',
        values: Array.from({ length: 5 }).map((_, index) => ({
            label: 'Size One',
            value_index: `color-${index}`,
        })),
    },
    {
        id: 'function',
        label: 'Function',
        values: Array.from({ length: 5 }).map((_, index) => ({
            label: 'Size One',
            value_index: `function-${index}`,
        })),
    },
];

const isConfigurableProduct = productData => {
    return productData?.__typename === 'ConfigurableProduct' || productData?.type_id === 'configurable';
};

export const getModalProductKey = productData => {
    return productData?.url_key || productData?.sku || productData?.uid || productData?.id;
};

export const shouldInitializeModalOptions = ({ initializedProductKey, isOpen, optionGroupCount, productKey }) => {
    return isOpen && !!productKey && optionGroupCount > 0 && initializedProductKey !== productKey;
};

export const shouldRenderModalContent = ({ configurableOptionCount, isConfigurable, showFallbackOptions }) => {
    return !isConfigurable || configurableOptionCount > 0 || showFallbackOptions;
};

export const getInitialSelectedOptions = (optionGroups, selectedOptionUids) => {
    if (!Array.isArray(optionGroups) || !Array.isArray(selectedOptionUids)) {
        return {};
    }

    const selectedUidSet = new Set(selectedOptionUids);

    return optionGroups.reduce((selectedOptions, group) => {
        const selectedValue = (group.values || []).find(value => selectedUidSet.has(value.uid));

        if (selectedValue) {
            selectedOptions[group.id] = selectedValue.uid || selectedValue.value_index || selectedValue.label;
        }

        return selectedOptions;
    }, {});
};

const AddToCartModal = ({
    isOpen,
    productData,
    productKey,
    formValues,
    confirmLabel = 'Add to Cart',
    hideQuantity = false,
    initialSelectedOptionUids = [],
    notifyLabel = 'Notify Me',
    showFallbackOptions = true,
    onClose,
    onConfirm,
    onNotify,
    onSelectionChange = () => {},
}) => {
    const history = useHistory();
    const [{ currentUser, isSignedIn }] = useUserContext();
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [now, setNow] = useState(Date.now);
    const initializedProductKeyRef = useRef(null);
    const [getProductDetail, { data: productDetailData }] = useLazyQuery(productOperations.getProductDetailQuery, {
        fetchPolicy: 'network-only',
    });
    const productDetailUrlKey = productData?.variant_parent_url_key || productData?.url_key;
    const loadedProductData = productDetailData?.products?.items?.find(item => item?.url_key === productDetailUrlKey);
    const modalProductData = loadedProductData || productData;
    const { handleSubmit: handleNotifySubmit } = useProductNotifyMe({
        item: modalProductData,
        view: history.location.pathname === '/' ? 'home' : 'cart',
    });

    useEffect(() => {
        if (isOpen && productDetailUrlKey) {
            getProductDetail({
                variables: {
                    urlKey: productDetailUrlKey,
                },
            });
        }
    }, [getProductDetail, isOpen, productDetailUrlKey]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = event => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            initializedProductKeyRef.current = null;
            return;
        }

        const currentProductKey = productKey || getModalProductKey(modalProductData);
        const configurableOptionGroups = getConfigurableOptionGroups(modalProductData);

        if (
            !shouldInitializeModalOptions({
                initializedProductKey: initializedProductKeyRef.current,
                isOpen,
                optionGroupCount: configurableOptionGroups.length,
                productKey: currentProductKey,
            })
        ) {
            return;
        }

        initializedProductKeyRef.current = currentProductKey;

        setQuantity(Number(formValues?.quantity) || 1);
        const initialSelectedOptions = getInitialSelectedOptions(configurableOptionGroups, initialSelectedOptionUids);
        const initialSelectedOptionUidsForModal = getSelectedOptionUids(
            configurableOptionGroups,
            initialSelectedOptions,
        );

        setSelectedOptions(initialSelectedOptions);
        onSelectionChange(initialSelectedOptionUidsForModal);
    }, [formValues, initialSelectedOptionUids, isOpen, modalProductData, onSelectionChange, productKey]);

    useEffect(() => {
        if (!isOpen) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') {
        return null;
    }

    const configurableOptionGroups = getConfigurableOptionGroups(modalProductData, selectedOptions);
    const selectedOptionUids = getSelectedOptionUids(configurableOptionGroups, selectedOptions);
    const selectedVariant = getSelectedConfigurableVariant(modalProductData, selectedOptionUids);
    const flashSaleCountdown = getFlashSaleCountdown(selectedVariant, now);
    const flashSaleOptionUids = getFlashSaleOptionUids(modalProductData, configurableOptionGroups, selectedOptions, now);
    const selectedPriceRange = selectedVariant?.price_range || modalProductData?.price_range;
    const imageUrl =
        getSelectedOptionSwatchImage(configurableOptionGroups, selectedOptions) ||
        getProductImageUrl(modalProductData, selectedVariant);
    const regularPrice = selectedPriceRange?.maximum_price?.regular_price;
    const finalPrice =
        selectedPriceRange?.minimum_price?.final_price ||
        selectedPriceRange?.maximum_price?.final_price ||
        regularPrice;
    const discountPercent = selectedPriceRange?.maximum_price?.discount?.percent_off;
    const optionGroups = configurableOptionGroups.length
        ? configurableOptionGroups
        : showFallbackOptions
        ? FALLBACK_OPTION_GROUPS
        : [];
    const isConfigurable = isConfigurableProduct(modalProductData);

    if (
        !shouldRenderModalContent({
            configurableOptionCount: configurableOptionGroups.length,
            isConfigurable,
            showFallbackOptions,
        })
    ) {
        return null;
    }

    const hasCompleteConfigurableSelection =
        !isConfigurable ||
        configurableOptionGroups.length === 0 ||
        !!selectedVariant;
    const isSelectedConfigurableSelectionSaleable =
        !isConfigurable ||
        configurableOptionGroups.length === 0 ||
        getIsConfigurableSelectionSaleable(modalProductData, selectedOptionUids);
    const isSelectedConfigurableSelectionOutOfStock =
        hasCompleteConfigurableSelection && !isSelectedConfigurableSelectionSaleable;
    const shouldSubmitSelectedOptions =
        isConfigurable && configurableOptionGroups.length > 0 && isSelectedConfigurableSelectionSaleable;
    const canConfirmSelection = hasCompleteConfigurableSelection;

    const handleDecrease = () => {
        setQuantity(currentQuantity => Math.max(1, (Number(currentQuantity) || 1) - 1));
    };

    const handleIncrease = () => {
        setQuantity(currentQuantity => (Number(currentQuantity) || 0) + 1);
    };

    const handleQuantityChange = event => {
        const nextQuantity = event.target.value;

        if (nextQuantity === '') {
            setQuantity('');
            return;
        }

        if (/^\d+$/.test(nextQuantity)) {
            setQuantity(Number(nextQuantity));
        }
    };

    const handleQuantityBlur = () => {
        setQuantity(currentQuantity => Math.max(1, Number(currentQuantity) || 1));
    };

    const getConfirmPayload = () => {
        const normalizedQuantity = Math.max(1, Number(quantity) || 1);

        return {
            ...formValues,
            quantity: normalizedQuantity,
            selected_variant: selectedVariant,
            variant_sku: selectedVariant?.sku,
            ...(shouldSubmitSelectedOptions
                ? {
                      selected_options: selectedOptionUids,
                  }
                : {}),
        };
    };

    const handleFallbackNotify = () => {
        if (!isSignedIn) {
            history.push(`/sign-in?redirect=/${modalProductData?.url_key}.html`);
            return;
        }

        if (currentUser?.email) {
            handleNotifySubmit({ email: currentUser.email });
        }
    };

    const handleConfirm = () => {
        const payload = getConfirmPayload();

        if (isSelectedConfigurableSelectionOutOfStock) {
            const handleNotify = onNotify || handleFallbackNotify;
            handleNotify(payload);
            onClose();
            return;
        }

        onConfirm(payload);
        onClose();
    };

    const stopModalEvent = event => {
        event.stopPropagation();
    };

    const handleOverlayClick = event => {
        event.stopPropagation();
        onClose();
    };

    const handleSelectOption = (groupId, valueId, isUnavailable) => {
        if (isUnavailable) {
            return;
        }

        setSelectedOptions(currentOptions => {
            const nextOptions = getNextSelectedOptions(currentOptions, groupId, valueId);
            const nextSelectedOptionUids = getSelectedOptionUids(configurableOptionGroups, nextOptions);

            onSelectionChange(nextSelectedOptionUids);

            return nextOptions;
        });
    };

    const optionContent = optionGroups.length ? (
        <div className={classes.options}>
            {optionGroups.map(group => (
                <div className={classes.optionGroup} key={group.id}>
                    <p className={classes.optionTitle}>{group.label}</p>
                    <div className={classes.optionGrid}>
                        {group.values.map(value => {
                            const {
                                isDisabled,
                                isUnavailable,
                                label,
                                stockLabel,
                                swatchContent,
                                valueId,
                            } = getOptionValuePresentation(group, value);
                            const isSelected = selectedOptions[group.id] === valueId;
                            const optionState = getModalOptionState({
                                classes,
                                isDisabled,
                                isSelected,
                                isUnavailable,
                                swatchContent,
                            });

                            return (
                                <button
                                    className={optionState.className}
                                    disabled={optionState.disabled}
                                    key={valueId}
                                    onClick={() => handleSelectOption(group.id, valueId, isDisabled)}
                                    type="button"
                                >
                                    {flashSaleOptionUids.has(value.uid) ? (
                                        <img
                                            className={classes.flashSaleIcon}
                                            src="/venia-static-assets/images/flashVariant.svg"
                                            alt="Flash Sale"
                                            width="20"
                                            height="20"
                                        />
                                    ) : null}
                                    {swatchContent?.type === 'image' ? (
                                        <span className={classes.swatchImage}>
                                            <img alt={label} src={swatchContent.value} />
                                        </span>
                                    ) : swatchContent?.type === 'color' ? (
                                        <span
                                            className={classes.swatchDot}
                                            style={{
                                                backgroundColor: swatchContent.value,
                                            }}
                                        />
                                    ) : swatchContent?.type === 'text' ? (
                                        <span className={classes.swatchText}>{swatchContent.value}</span>
                                    ) : null}
                                    <span className={classes.optionLabel}>{label}</span>
                                    {stockLabel ? <span className={classes.optionBadge}>{stockLabel}</span> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    ) : null;

    const content = (
        <div
            className={classes.overlay}
            onClick={handleOverlayClick}
            onMouseDown={stopModalEvent}
            onPointerDown={stopModalEvent}
            onTouchStart={stopModalEvent}
        >
            <div
                aria-modal="true"
                className={classes.modal}
                onClick={stopModalEvent}
                onMouseDown={stopModalEvent}
                onPointerDown={stopModalEvent}
                onTouchStart={stopModalEvent}
                role="dialog"
            >
                <button aria-label="Close" className={classes.closeButton} onClick={onClose} type="button">
                    &times;
                </button>
                <div className={classes.productSummary}>
                    <div className={classes.imageWrap}>
                        {imageUrl ? (
                            <img alt={modalProductData?.name || ''} className={classes.image} src={imageUrl} />
                        ) : null}
                    </div>
                    <div className={classes.productInfo}>
                        {flashSaleCountdown ? (
                            <CountdownDisplay
                                countdown={flashSaleCountdown}
                                classes={{
                                    wrap: classes.flashSaleCountdown,
                                    wrapEnd: classes.flashSaleCountdownEnd,
                                    endText: classes.flashSaleEndText,
                                    num: classes.flashSaleNumber,
                                    gap: classes.flashSaleGap,
                                }}
                            />
                        ) : null}
                        {finalPrice?.value ? (
                            <div className={classes.finalPrice}>
                                <Price currencyCode={finalPrice.currency} value={finalPrice.value} />
                            </div>
                        ) : null}
                        <div className={classes.priceMeta}>
                            {regularPrice?.value && regularPrice.value !== finalPrice?.value ? (
                                <span className={classes.regularPrice}>
                                    <Price currencyCode={regularPrice.currency} value={regularPrice.value} />
                                </span>
                            ) : null}
                            {discountPercent ? (
                                <span className={classes.discount}>-{Math.round(discountPercent)}%</span>
                            ) : null}
                        </div>
                        {!hideQuantity ? (
                            <div className={classes.quantity}>
                                <button onClick={handleDecrease} type="button">
                                    -
                                </button>
                                <input
                                    aria-label="Item Quantity"
                                    className={classes.quantityInput}
                                    inputMode="numeric"
                                    min="1"
                                    onBlur={handleQuantityBlur}
                                    onChange={handleQuantityChange}
                                    pattern="[0-9]*"
                                    type="text"
                                    value={quantity}
                                />
                                <button onClick={handleIncrease} type="button">
                                    +
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
                {optionContent}
                <button
                    className={classes.confirmButton}
                    disabled={!canConfirmSelection}
                    onClick={handleConfirm}
                    type="button"
                >
                    {isSelectedConfigurableSelectionOutOfStock ? notifyLabel : confirmLabel}
                </button>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default AddToCartModal;
