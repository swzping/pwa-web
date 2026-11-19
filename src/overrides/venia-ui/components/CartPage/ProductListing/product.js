import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { Heart, Edit2 } from 'react-feather';
import { gql, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useProduct } from '@magento/peregrine/lib/talons/CartPage/ProductListing/useProduct';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Price from '@magento/venia-ui/lib/components/Price';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Image from '@magento/venia-ui/lib/components/Image';
import { MiniCartFragment } from '@magento/peregrine/lib/talons/MiniCart/miniCartFragments.gql';
import { ProductListingFragment } from '@magento/peregrine/lib/talons/CartPage/ProductListing/productListingFragments.gql';
// import Kebab from '@magento/venia-ui/lib/components/LegacyMiniCart/kebab';
import Section from '@magento/venia-ui/lib/components/LegacyMiniCart/section';
import AddToListButton from '@magento/venia-ui/lib/components/Wishlist/AddToListButton';
import Button from '@magento/venia-ui/lib/components/Button';
import Quantity from '@magento/venia-ui/lib/components/CartPage/ProductListing/quantity';
import { TrashOutlined } from '@/assets/icons'
import Popup from '@/modules/swift-pwa-ui/components/Popup'
import defaultClasses from './product.module.css';
import { useCartFlashSale } from '../../../../../helpers/useCartFlashSale';
import CartPageVariantSelector from './variantSelector';

import { CartPageFragment } from '@magento/peregrine/lib/talons/CartPage/cartPageFragments.gql.js';
import { AvailableShippingMethodsCartFragment } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/ShippingMethods/shippingMethodsFragments.gql.js';
import ProductBadges from '../../../../../modules/swift-pwa-ui/components/Gallery/productBadges';
import GiftChangeModal from '../../../../../modules/swift-pwa-ui/components/FreeGift/GiftChangeModal';
import AddToCartModal from '../../../../../modules/swift-pwa-ui/components/Gallery/addToCartModal';
import { getMiniCartItemLinkPath } from '../../MiniCart/ProductList/itemLink';
import { getVariantOptionText } from './variantOptionText';
import shouldShowCartItemVariant from '../../../../../helpers/shouldShowCartItemVariant';

const IMAGE_SIZE = 100;

// const HeartIcon = <Icon size={16} src={Heart} />;
const HeartIcon = <Heart color="#4D4D4D" size={16} />;
const HeartIconMobile = <Heart color="#FFFFFF" size={16} />;

const Product = props => {
    const {
        item,
        isCartUpdating,
        isLoading,
        isMobile,
        fetchCartDetails,
        refetchCartPage,
        setIsCartUpdating,
        isMiniCart,
        isUnavailable
    } = props;
    const [comfirmDelete, setComfirmDelete] = useState(false)
    const handleRequestRemove = useCallback(() => setComfirmDelete(true), []);
    const [isGiftChangeOpen, setIsGiftChangeOpen] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [isRowSelected, setIsRowSelected] = useState(!isUnavailable);
    const { formatMessage } = useIntl();
    const [{ cartId }, { actions: { updateCartObsolete } }] = useCartContext();
    const [, { addToast }] = useToasts();
    const [updateConfigurableOptions] = useMutation(
        UPDATE_CONFIGURABLE_OPTIONS_MUTATION
    );
    const talonProps = useProduct({
        operations: {
            removeItemMutation: REMOVE_ITEM_MUTATION,
            updateItemQuantityMutation: UPDATE_QUANTITY_MUTATION
        },
        ...props,
        onRequestRemove: handleRequestRemove
    });

    const {
        addToWishlistProps,
        errorMessage,
        handleEditItem,
        handleRemoveFromCart,
        handleUpdateItemQuantity,
        isEditable,
        product,
        isProductUpdating,
        displaySubtotalLoaderId,
        displayRemoveLoaderId,
        quantityResetKey
    } = talonProps;

    const {
        currency,
        image,
        name,
        quantity,
        stockStatus,
        stockItem,
        unitPrice,
        urlKey,
        urlSuffix,
        customCartDiscount,
        promo,
        sku,
        is_free_gift,
        is_gamification_free_gift
    } = product;
    const { is_flash_sale, hours, minutes, seconds, isFinished } = useCartFlashSale(props.item);
    if (is_flash_sale === 1) {
        localStorage.setItem('isExistFlashSale', true);
    }

    const classes = useStyle(defaultClasses, props.classes);

    const itemClassName = isProductUpdating
        ? classes.item_disabled
        : classes.item;

    const editItemSection = isEditable ? (
        <Section
            text={formatMessage({
                id: 'product.editItem',
                defaultMessage: 'Edit item'
            })}
            onClick={handleEditItem}
            icon="Edit2"
            classes={{
                text: classes.sectionText
            }}
        />
    ) : null;

    const discountAmount = useMemo(() => {
        return customCartDiscount && customCartDiscount.find(x => x.promo_id === "special_price")?.discount_amount
    }, [customCartDiscount])

    const regularPrice = useMemo(() => {
        if (discountAmount) {
            return unitPrice + discountAmount
        }
    }, [discountAmount, unitPrice])

    const itemLink = useMemo(
        () => resourceUrl(
            getMiniCartItemLinkPath({
                configurableOptions: item.configurable_options,
                product: {
                    url_key: urlKey,
                    url_suffix: urlSuffix,
                },
            })
        ),
        [item.configurable_options, urlKey, urlSuffix]
    );
    const configurableOptions = item.configurable_options || [];
    const selectedOptionUids = useMemo(
        () =>
            configurableOptions
                .map(option => option.configurable_product_option_value_uid)
                .filter(Boolean),
        [configurableOptions]
    );
    const itemStockStatus =
        item?.configured_variant?.stock_status ||
        item?.product?.stock_status ||
        stockStatus;
    const variantButtonText = useMemo(() => {
        if (itemStockStatus === 'OUT_OF_STOCK') {
            return 'Change other variant';
        }

        return getVariantOptionText(configurableOptions) || 'Change variant';
    }, [configurableOptions, itemStockStatus]);
    const variantSelector = shouldShowCartItemVariant(item) && configurableOptions.length ? (
        <button
            type="button"
            className={`${classes.variantButton} ${
                itemStockStatus === 'OUT_OF_STOCK'
                    ? classes.variantButtonWarning
                    : ''
            }`}
            onClick={() => setIsVariantModalOpen(true)}
        >
            <span className={classes.variantButtonText}>{variantButtonText}</span>
            <span aria-hidden="true" className={classes.variantChevron} />
        </button>
    ) : null;

    const handleClosePop = () => {
        setComfirmDelete(false)
    }

    const handleOpenGiftChange = () => {
        setIsGiftChangeOpen(true);
    };

    const handleCloseGiftChange = () => {
        setIsGiftChangeOpen(false);
    };

    const handleVariantConfirm = async value => {
        const variantSku = value?.variant_sku;

        if (!variantSku) {
            return;
        }

        if (variantSku === item?.configured_variant?.sku) {
            return;
        }

        try {
            setIsCartUpdating?.(true);
            updateCartObsolete(false);

            const res = await updateConfigurableOptions({
                variables: {
                    cartId,
                    cartItemId: item.uid,
                    parentSku: item.product.sku,
                    quantity: item.quantity,
                    variantSku
                }
            });

            const userErrors =
                res?.data?.removeItemFromCart?.user_errors || [];

            if (userErrors.length) {
                addToast({
                    type: 'error',
                    message: userErrors[0]?.message || '',
                    timeout: 3000
                });
                return;
            }

            updateCartObsolete(true);
            await refetchCartPage?.();
        } catch (err) {
            addToast({
                type: 'error',
                message: err.message || deriveErrorMessage(err),
                timeout: 3000
            });
        } finally {
            setIsCartUpdating?.(false);
        }
    };

    const toggleRowSelected = () => {
        setIsRowSelected(value => !value);
    };

    const handleGiftChanged = async ({ cartId }) => {
        if (setIsCartUpdating) {
            setIsCartUpdating(true);
        }

        try {
            if (fetchCartDetails && cartId) {
                await fetchCartDetails({ variables: { cartId } });
            }

            if (refetchCartPage) {
                await refetchCartPage();
            }
        } finally {
            if (setIsCartUpdating) {
                setIsCartUpdating(false);
            }
        }
    };

    const customizableOptions =
        item.customizable_options && item.customizable_options.length > 0 ? (
            <>
                {item.customizable_options.map((item, index) => (
                    <div key={index}>
                        <span>
                            <span className={classes.customizableTitle}>
                                {item.label}:
                            </span>{' '}
                            {item.values.map(item => item.label).join(', ')}
                        </span>
                    </div>
                ))}
            </>
        ) : null;

    const bundleOptions =
        item.bundle_options && item.bundle_options.length > 0 ? (
            <div className={classes.customizable}>
                {item.bundle_options.map((val, idx) => (
                    <div key={idx}>
                        <span className={classes.customizableTitle}>
                            {val.label}
                        </span>{' '}
                        :
                        <div>
                            {val.values.map((item, idt) => (
                                <div style={{ fontSize: '12px' }} key={idt}>
                                    {/* {item.quantity} */}
                                    {item.label}
                                    {' + '}
                                    <strong>
                                        <Price
                                            currencyCode={currency}
                                            value={item.price}
                                        />
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : null;

    const rowCheckbox = (
        // <button
        //     type="button"
        //     className={`${classes.tableCheckbox} ${
        //         isRowSelected ? classes.tableCheckboxChecked : ''
        //     }`}
        //     aria-pressed={isRowSelected}
        //     aria-label={`${isRowSelected ? 'Deselect' : 'Select'} ${name}`}
        //     onClick={toggleRowSelected}
        // />
        <></>
    );

    if (!isMobile && isUnavailable) {
        return (
            <tr className={`${classes.tableData} ${classes.unavailableRow}`}>
                <td className={classes.tableSelectCell}>
                    {rowCheckbox}
                </td>
                <td className={classes.unavailableImageCell}>
                    <Link
                        to={itemLink}
                        className={classes.unavailableImageContainer}
                    >
                        <Image
                            alt={name}
                            classes={{
                                root: classes.unavailableImageRoot,
                                image: classes.unavailableImage
                            }}
                            width={IMAGE_SIZE}
                            resource={image}
                        />
                        <span className={classes.unavailableDeliveryBadge}>
                            {item.unavailable_label || 'Home Delivery'}
                        </span>
                    </Link>
                </td>
                <td className={classes.unavailableNameCell} colSpan="4">
                    <Link className={classes.unavailableNameLink} to={itemLink}>
                        {name}
                    </Link>
                </td>
                <td className={classes.tableEdit}>
                    <div className={classes.editWrapper}>
                        <button
                            type="button"
                            className={classes.deleteButton}
                            aria-label={`Remove ${name}`}
                        >
                            <TrashOutlined />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    if (isMobile && isUnavailable) {
        return (
            <li className={`${classes.root} ${classes.mobileUnavailableRow}`}>
                <div className={classes.mobileUnavailableContent}>
                    <div className={classes.mobileSelectCell}>{rowCheckbox}</div>
                    <Link
                        to={itemLink}
                        className={classes.mobileUnavailableImageContainer}
                    >
                        <Image
                            alt={name}
                            classes={{
                                root: classes.mobileUnavailableImageRoot,
                                image: classes.mobileUnavailableImage
                            }}
                            width={IMAGE_SIZE}
                            resource={image}
                        />
                        <span className={classes.unavailableDeliveryBadge}>
                            {item.unavailable_label || 'Home Delivery'}
                        </span>
                    </Link>
                    <Link className={classes.mobileUnavailableName} to={itemLink}>
                        {name}
                    </Link>
                    <button
                        type="button"
                        className={classes.deleteButton}
                        aria-label={`Remove ${name}`}
                    >
                        <TrashOutlined />
                    </button>
                </div>
            </li>
        );
    }

    if (isMobile && (is_free_gift || is_gamification_free_gift)) {
        return (
            <li
                className={`${classes.root} ${classes.freeGift} ${
                    item.is_last_free_gift ? classes.lastFreeGift : ''
                } ${isMiniCart ? classes.miniCartFreeGift : ''}`}
            >
                <div className={classes.mobileFreeGiftContent}>
                    <Link to={itemLink} className={classes.mobileFreeGiftImage}>
                        <Image
                            alt={name}
                            classes={{
                                root: classes.mobileFreeGiftImageRoot,
                                image: classes.mobileFreeGiftImageEl
                            }}
                            width={IMAGE_SIZE}
                            resource={image}
                        />
                    </Link>
                    <div className={classes.mobileFreeGiftDetails}>
                        <Link
                            className={classes.mobileFreeGiftName}
                            to={itemLink}
                        >
                            {name}
                        </Link>
                        <div className={classes.mobileFreeGiftQty}>
                            Qty x{quantity}
                        </div>
                        <div className={classes.mobileFreeGiftMeta}>
                            <span className={classes.mobileFreeGiftLabel}>
                                Free Gift
                            </span>
                            {is_free_gift && !is_gamification_free_gift && (
                                <button
                                    type="button"
                                    className={classes.giftChangeButton}
                                    onClick={handleOpenGiftChange}
                                >
                                    Change
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <GiftChangeModal
                    isOpen={isGiftChangeOpen}
                    onClose={handleCloseGiftChange}
                    itemId={item.free_gift_parent_item_id || item.id}
                    currentGiftSku={sku}
                    currentGiftName={name}
                    onGiftChanged={handleGiftChanged}
                    variant={isMiniCart ? 'drawer' : 'modal'}
                />
            </li>
        );
    }

    return (
        <>
            {
                isMobile ? (
                    <li
                        className={`${classes.root} ${
                            is_free_gift || is_gamification_free_gift ? classes.freeGift : ''
                        } ${
                            item.has_free_gifts ? classes.mainWithFreeGifts : ''
                        }`}
                    >
                        <span className={classes.errorText}>{errorMessage}</span>
                        <div
                            className={`${itemClassName} ${
                                isMiniCart
                                    ? classes.miniCartProductItem
                                    : classes.mobileCartProductItem
                            }`}
                        >
                            {displayRemoveLoaderId === item.id || displaySubtotalLoaderId === item.id ?
                                <div className={classes.removeLoader}>
                                    <span className={classes.loader}></span>
                                    {displayRemoveLoaderId === item.id ?
                                        <span className={classes.loaderText}>Remove Item...</span>
                                        : <span className={classes.loaderText}>Update Item...</span>
                                    }
                                </div>
                                : null
                            }
                            <div className={classes.mobileSelectCell}>
                                {is_free_gift || is_gamification_free_gift ? null : rowCheckbox}
                            </div>
                            <Link to={itemLink} className={classes.imageContainer}>
                                {is_flash_sale === 1 && !isFinished && <img style={{ position: 'absolute', zIndex: 1, width: 28, top: 4, left: 4 }} src='/venia-static-assets/images/flashProduct.png' />}
                                <Image
                                    alt={name}
                                    classes={{
                                        root: classes.imageRoot,
                                        image: classes.image
                                    }}
                                    width={IMAGE_SIZE}
                                    resource={image}
                                />
                                {promo && promo.length && (
                                    <div className={classes.productPromo}>{promo}</div>
                                )}
                                {stockStatus === 'OUT_OF_STOCK' && <div className={classes.outOfStock}>Out of Stock</div>}
                            </Link>
                            <div className={classes.details}>
                                <div className={classes.name}>
                                    <Link className={classes.nameLink} to={itemLink}>
                                        {name}
                                    </Link>
                                    {customizableOptions}
                                    {bundleOptions}
                                </div>
                                <CartPageVariantSelector
                                    classes={classes}
                                    item={item}
                                    quantity={quantity}
                                    refetchCartPage={refetchCartPage}
                                    setIsCartUpdating={setIsCartUpdating}
                                />
                                <span className={classes.price}>
                                    {!(is_free_gift || is_gamification_free_gift) && (
                                        customCartDiscount.some(i => i.promo_id === "special_price") ?
                                            <div className={`${classes.priceWrapper} ${classes.specialPrice}`}>
                                                <Price
                                                    currencyCode={currency}
                                                    value={unitPrice}
                                                />
                                                <div className={classes.discountWrapper}>
                                                    {regularPrice && (
                                                        <>
                                                            <span className={classes.discountPrice}>
                                                                <Price
                                                                    currencyCode={currency}
                                                                    value={regularPrice}
                                                                />
                                                            </span>
                                                            <span className={classes.discountValue}>
                                                                -
                                                                <FormattedNumber
                                                                    maximumFractionDigits={0}
                                                                    value={
                                                                        (discountAmount / regularPrice) * 100
                                                                    }
                                                                />
                                                                %
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            : <Price currencyCode={currency} value={unitPrice} />
                                    )}
                                </span>
                                <div className={classes.quantity}>
                                    {is_free_gift || is_gamification_free_gift ? <span style={{ fontWeight: 500 }}>Qty x{quantity}</span> : (
                                        <Quantity
                                            key={quantityResetKey}
                                            itemId={item.id}
                                            initialValue={quantity}
                                            onChange={handleUpdateItemQuantity}
                                            isCartUpdating={isCartUpdating}
                                            maxQty={stockItem?.max_sale_qty}
                                            cartPage
                                        />
                                    )}
                                </div>
                                {is_free_gift && !is_gamification_free_gift && (
                                    <button
                                        type="button"
                                        className={classes.giftChangeButton}
                                        onClick={handleOpenGiftChange}
                                    >
                                        Change
                                    </button>
                                )}
                                {is_flash_sale === 1 && !isFinished && <div className={classes.endsStyle} style={{ position: 'relative', marginTop: 6 }}>Ends in {hours} : {minutes} : {seconds}</div>}
                                {/* cart页面 */}
                                {!(is_free_gift || is_gamification_free_gift) && <ProductBadges badges={item?.validOffers} productLink={itemLink} />}
                                <div className={classes.itemTotalWrapper}>
                                    <span>Item Total</span>
                                    <div className={classes.itemTotalPrice}>
                                        {customCartDiscount.some(i => i.promo_id === "special_price") ?
                                             is_free_gift || is_gamification_free_gift ? 'Free Gift' : <Price currencyCode={currency} value={unitPrice * quantity} />  
                                            : is_free_gift || is_gamification_free_gift ? 'Free Gift' : <Price currencyCode={currency} value={unitPrice * quantity} />
                                        }
                                    </div>
                                </div>
                                {stockItem?.salable_qty < quantity && stockItem?.salable_qty != 0 ?
                                    <div className={classes.qtyStatus}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                                        </svg>
                                        <span>Unavailable Qty</span>
                                    </div>
                                    : null
                                }
                            </div>
                        </div>
                        <div className={classes.editMobileWrapper}>
                            {!(is_free_gift || is_gamification_free_gift) && (
                                <button
                                    onClick={() => setComfirmDelete(true)}
                                    className={classes.mobileDeleteIcon}
                                >
                                    <TrashOutlined />
                                </button>
                            )}
                        </div>
                    </li>
                ) :
                    <tr
                        className={`${classes.tableData} ${
                            is_free_gift || is_gamification_free_gift ? classes.freeGift : ''
                        } ${
                            item.has_free_gifts ? classes.mainWithFreeGifts : ''
                        } ${
                            item.is_last_free_gift
                                ? classes.lastFreeGift
                                : ''
                        }`}
                    >
                        {displayRemoveLoaderId === item.id ?
                            <div className={classes.removeLoader}>
                                <span className={classes.loader}></span>
                                <span className={classes.loaderText}>Remove Item...</span>
                            </div>
                            : null
                        }
                        <td className={classes.tableSelectCell}>
                            {is_free_gift || is_gamification_free_gift ? null : rowCheckbox}
                        </td>
                        <td>
                            <Link to={itemLink} className={classes.imageContainer}>
                                {is_flash_sale === 1 && !isFinished && <img style={{ position: 'absolute', zIndex: 1, width: 28, top: 4, left: 4 }} src='/venia-static-assets/images/flashProduct.png' />}
                                <Image
                                    alt={name}
                                    classes={{
                                        root: classes.imageRoot,
                                        image: classes.image
                                    }}
                                    width={IMAGE_SIZE}
                                    resource={image}
                                />
                                {promo && promo.length && (
                                    <div className={classes.productPromo}>{promo}</div>
                                )}
                                { stockStatus === 'OUT_OF_STOCK' && <div className={classes.outOfStock}>Out of Stock</div>}
                                {isUnavailable && (
                                    <div className={classes.unavailableLabel}>
                                        {item.unavailable_label || 'Home Delivery'}
                                    </div>
                                )}
                            </Link>
                            {is_flash_sale === 1 && !isFinished && <div className={classes.endsStyle}>Ends in {hours} : {minutes} : {seconds}</div>}
                        </td>
                        <td className={classes.tableDataName}>
                            <Link className={classes.nameLink} to={itemLink}>
                                {name}
                            </Link>
                            {stockItem?.salable_qty < quantity && stockItem?.salable_qty != 0 ?
                                <div className={classes.qtyStatus}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                                    </svg>
                                    <span>Unavailable Qty</span>
                                </div>
                                : null
                            }
                            {customizableOptions}
                            {bundleOptions}
                            {variantSelector}
                        </td>
                        <td>
                            {isUnavailable ? null : is_free_gift || is_gamification_free_gift ? <ProductBadges badges={[{ promotion_type: 'Free Gift', name: 'Free Gift' }]} /> : (
                                customCartDiscount.some(i => i.promo_id === "special_price") ?
                                    <div className={`${classes.priceWrapper} ${classes.specialPrice}`} style={{ fontWeight: 700 }}>
                                        <Price
                                            currencyCode={currency}
                                            value={unitPrice}
                                        />
                                        {!(is_free_gift || is_gamification_free_gift) && <ProductBadges badges={item?.validOffers} productLink={itemLink} />}
                                        {
                                            <div className={classes.discountWrapper}>
                                                {regularPrice && (
                                                    <>
                                                        <span className={classes.discountPrice}>
                                                            <Price
                                                                currencyCode={currency}
                                                                value={regularPrice}
                                                            />
                                                        </span>
                                                        <span className={classes.discountValue}>
                                                            -
                                                            <FormattedNumber
                                                                maximumFractionDigits={0}
                                                                value={
                                                                    (discountAmount / regularPrice) * 100
                                                                }
                                                            />
                                                            %
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        }
                                    </div>
                                    : <div style={{ fontWeight: 700 }}>
                                        <Price currencyCode={currency} value={unitPrice} />
                                        {!(is_free_gift || is_gamification_free_gift) && <ProductBadges badges={item?.validOffers} productLink={itemLink} />}
                                    </div>
                            )}
                        </td>
                        <td>
                            {isUnavailable ? null : is_free_gift || is_gamification_free_gift ? <span style={{ fontWeight: 500 }}>Qty x{quantity}</span> : (
                                <Quantity
                                    key={quantityResetKey}
                                    itemId={item.id}
                                    initialValue={quantity}
                                    onChange={handleUpdateItemQuantity}
                                    isCartUpdating={isCartUpdating}
                                    maxQty={stockItem?.max_sale_qty}
                                    cartPage
                                />
                            )}
                        </td>
                        <td className={classes.tableDataTotalPrice}>
                            {isUnavailable ? null : (displaySubtotalLoaderId === item.id) ?
                                <div className={classes.loaderWrapper}>
                                    <span className={classes.loader}></span>
                                    <span className={classes.loaderText}>Loading...</span>
                                </div>
                                : <>
                                    {customCartDiscount.some(i => i.promo_id === "special_price") ?
                                        <Price currencyCode={currency} value={unitPrice * quantity} />
                                        : <Price currencyCode={currency} value={unitPrice * quantity} />
                                    }
                                </>
                            }
                        </td>
                        <td className={classes.tableEdit}>
                            <div className={classes.editWrapper}>
                                {/* <AddToListButton
                            isCartPage
                            {...addToWishlistProps}
                            classes={{
                                root: classes.addToListButton,
                                root_selected:
                                    classes.addToListButton_selected
                            }}
                            icon={HeartIcon}
                        /> */}
                                <div className={classes.errorText}>{errorMessage}</div>
                                {(!(is_free_gift || is_gamification_free_gift) || isUnavailable) && (
                                    <button
                                        onClick={
                                            isUnavailable
                                                ? undefined
                                                : () => setComfirmDelete(true)
                                        }
                                        className={classes.deleteButton}
                                        aria-disabled={isUnavailable}
                                    >
                                        <TrashOutlined />
                                    </button>
                                )}
                                {is_free_gift && !is_gamification_free_gift && !isUnavailable && (
                                    <button
                                        type="button"
                                        className={classes.giftChangeButton}
                                        onClick={handleOpenGiftChange}
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
            }

            <GiftChangeModal
                isOpen={isGiftChangeOpen}
                onClose={handleCloseGiftChange}
                itemId={item.free_gift_parent_item_id || item.id}
                currentGiftSku={sku}
                currentGiftName={name}
                onGiftChanged={handleGiftChanged}
                variant={isMiniCart ? 'drawer' : 'modal'}
            />

            <AddToCartModal
                confirmLabel="Update"
                formValues={{
                    quantity
                }}
                hideQuantity
                initialSelectedOptionUids={selectedOptionUids}
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                onConfirm={handleVariantConfirm}
                productData={item.product}
                productKey={`${item.uid || item.id}-variant`}
                showFallbackOptions={false}
            />

            {
                comfirmDelete && (<Popup
                    isOpen={!!comfirmDelete}
                    title="Delete Item"
                    position="center"
                    closeOnClickOverlay={false}
                    onClose={handleClosePop}
                    style={{ display: 'flex', flexDirection: 'column', width: '80%', maxWidth: '500px' }}
                >
                    <div className={classes.comfirmPopBody}>Are you sure you want to remove this item from your cart?</div>
                    <div className={classes.comfirmPopFooter}>
                        <Button
                            type="button"
                            priority="low"
                            onClick={handleClosePop}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            priority="high"
                            onClick={() => {
                                handleRemoveFromCart()
                                handleClosePop()
                            }}
                            disabled={isProductUpdating}
                        >
                            Delete
                        </Button>
                    </div>
                </Popup>)
            }
        </>
    );
};

export default Product;

export const REMOVE_ITEM_MUTATION = gql`
    mutation removeItem($cartId: String!, $itemId: Int!) {
        removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $itemId })
            @connection(key: "removeItemFromCart") {
            cart {
                id
                ...ProductListingFragment
            }
        }
    }
    ${ProductListingFragment}
`;

export const UPDATE_CONFIGURABLE_OPTIONS_MUTATION = gql`
    mutation updateConfigurableOptions(
        $cartId: String!
        $cartItemId: ID!
        $parentSku: String!
        $quantity: Float!
        $variantSku: String!
    ) {
        addConfigurableProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [
                    {
                        data: { quantity: $quantity, sku: $variantSku }
                        parent_sku: $parentSku
                    }
                ]
            }
        ) @connection(key: "addConfigurableProductsToCart") {
            cart {
                id
            }
        }
        removeItemFromCart(
            input: { cart_id: $cartId, cart_item_uid: $cartItemId }
        ) @connection(key: "removeItemFromCart") {
            cart {
                id
                ...ProductListingFragment
            }
        }
    }
    ${ProductListingFragment}
`;

export const UPDATE_QUANTITY_MUTATION = gql`
    mutation updateItemQuantity(
        $cartId: String!
        $itemId: Int!
        $quantity: Float!
    ) {
        updateCartItems(
            input: {
                cart_id: $cartId
                cart_items: [{ cart_item_id: $itemId, quantity: $quantity }]
            }
        ) @connection(key: "updateCartItems") {
            cart {
                id
                ...ProductListingFragment
            }
            user_errors {
                message
                code
            }
        }
    }
    ${ProductListingFragment}
`;
