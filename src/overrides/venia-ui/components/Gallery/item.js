import React, { useEffect, useMemo } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Info } from 'react-feather';
import { string, number, shape, bool, arrayOf } from 'prop-types';
import { Link } from 'react-router-dom';
import Rating from 'react-rating';
import Price from '@magento/venia-ui/lib/components/Price';
import { UNCONSTRAINED_SIZE_KEY } from '@magento/peregrine/lib/talons/Image/useImage';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import Image from '@magento/venia-ui/lib/components/Image';
import GalleryItemShimmer from '@magento/venia-ui/lib/components/Gallery/item.shimmer';
import defaultClasses from './item.module.css';
import WishlistGalleryButton from '@magento/venia-ui/lib/components/Wishlist/AddToListButton';

import { useGalleryItem } from '../../../peregrine/talons/Gallery/useGalleryItem';
import AddToCart from '../../../../modules/swift-pwa-ui/components/Gallery/addToCart';
import CompareGalleryButton from '../../../../modules/swift-pwa-ui/components/Compare/AddToListButton';
import rootClasses from '../../../../modules/swift-pwa-ui/components/Gallery/index.module.css';
import LabelPromotion from '../../../../modules/swift-pwa-ui/components/Gallery/labelPromotion';
import ProductBadges from '../../../../modules/swift-pwa-ui/components/Gallery/productBadges';
import DiscountRibbon from '../../../../modules/swift-pwa-ui/components/DiscountRibbon';
import { useSimpleCountdown } from '../../components/ProductFullDetail/countDown/useCountdown'

// The placeholder image is 4:5, so we should make sure to size our product
// images appropriately.
const IMAGE_WIDTH = 300;
const IMAGE_HEIGHT = 375;

// Gallery switches from two columns to three at 640px.
const IMAGE_WIDTHS = new Map()
    .set(640, IMAGE_WIDTH)
    .set(UNCONSTRAINED_SIZE_KEY, 840);

const GalleryItem = props => {
    const {
        handleLinkClick,
        handleQuickviewClick,
        item,
        wishlistButtonProps,
        compareListButtonProps,
        isSupportedProductType
    } = useGalleryItem(props);

    const {
        relativePath,
        storeConfig,
        setDataProductAlertMessage = () => { },
        pageView = '',
        setDataProductAlertLoading = () => { },
        onAddToCartSuccess = () => { },
        itemGalleryRef = null
    } = props;
    const { hours, minutes, seconds, isFinished } = useSimpleCountdown(props?.item?.special_from_date, props?.item?.special_to_date);

    const productUrlSuffix = storeConfig && storeConfig.product_url_suffix;

    const classes = useStyle(defaultClasses, props.classes);

    if (!item) {
        return <GalleryItemShimmer classes={classes} />;
    }

    const { name, price_range, small_image, url_key, variant_parent_sku, variant_parent_url, variant_parent_url_key, variant_parent_url_suffix } = item;
    const { url: smallImageURL } = small_image;
    const productUrlPath = variant_parent_url || `${variant_parent_url_key || url_key}${variant_parent_url_suffix || productUrlSuffix || ''}`;
    const variantPreselectedOptions = Array.isArray(item.variant_preselected_options)
        ? item.variant_preselected_options
        : [];
    const productLink = resourceUrl(
        `/${productUrlPath}${
            variant_parent_sku && variantPreselectedOptions.length
                ? `?selected_options=${variantPreselectedOptions.map(encodeURIComponent).join(',')}`
                : ''
        }`
    );

    // app ProductItem parity — discount ribbon beside the flash
    // badge, driven by the discount_percentage attribute
    const showDiscountRibbon = Number(item.discount_percentage) > 0;

    const labelPromotion = item.sale && (
        <div className={classes.labelPromoWrapper}>
            <LabelPromotion label={item.sale} />
        </div>
    );

    const labelPromotion2 = item.promo && (
        <div className={classes.labelPromoWrapper2}>
            <span>{item.promo}</span>
        </div>
    );

    const wishlistButton = wishlistButtonProps ? (
        <WishlistGalleryButton {...wishlistButtonProps} />
    ) : null;

    const compareButton = wishlistButtonProps ? (
        <CompareGalleryButton {...compareListButtonProps} />
    ) : null;

    const addButton = isSupportedProductType ? (
        <AddToCart
            productData={item}
            productLink={productLink}
            relativePath={relativePath}
            setDataProductAlertMessage={setDataProductAlertMessage}
            setDataProductAlertLoading={setDataProductAlertLoading}
            pageView={pageView}
            onAddToCartSuccess={onAddToCartSuccess}
        />
    ) : (
        <div className={classes.unavailableContainer}>
            <Info />
            <p>
                <FormattedMessage
                    id={'galleryItem.unavailableProduct'}
                    defaultMessage={'Currently unavailable for purchase.'}
                />
            </p>
        </div>
    );

    const maybeQuickviewButton = useMemo(() => {
        if (!!process.env.GALLERYITEM_QUICKVIEW_ENABLE) {
            return (
                <div
                    className={`${classes.quickviewActionContainer
                        } hidden-mobile`}
                >
                    <Button
                        priority="high"
                        negative={true}
                        onClick={handleQuickviewClick}
                    >
                        Quick View
                    </Button>
                </div>
            );
        }

        return null;
    }, [process.env.GALLERYITEM_QUICKVIEW_ENABLE]);

    // TODO: 待删除，临时使用 提供视图
    const percent_off = price_range.maximum_price.discount.percent_off
    const rating = 0

    useEffect(() => {
        if (props?.item?.is_flash_sale === 1) {
            localStorage.setItem('isListExistFlashSale', true)
        }
        return () => {
            localStorage.setItem('isListExistFlashSale', '')
        }
    }, [])

    return (
        <div
            ref={itemGalleryRef}
            className={`${rootClasses.root} ${classes.root} product-list-item`}
            aria-live="polite"
            aria-busy="false"
        >
            {(props?.item?.is_flash_sale === 1 && !isFinished) || showDiscountRibbon ? (
                <div style={{ position: 'absolute', top: 8, left: 8, margin: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    {props?.item?.is_flash_sale === 1 && !isFinished && <img style={{ width: 32, margin: 0, borderRadius: 0 }} src='/venia-static-assets/images/flashProduct.png' alt="" />}
                    {showDiscountRibbon && <DiscountRibbon percent={item.discount_percentage} width={32} />}
                </div>
            ) : null}
            <div className={classes.images}>
                <Link onClick={handleLinkClick} to={productLink}>
                    {labelPromotion}
                    {labelPromotion2}
                    <Image
                        alt={name}
                        classes={{
                            image: classes.image,
                            loaded: classes.imageLoaded,
                            notLoaded: classes.imageNotLoaded,
                            root: classes.imageContainer
                        }}
                        height={IMAGE_HEIGHT}
                        resource={smallImageURL}
                        widths={IMAGE_WIDTHS}
                    />
                </Link>
                {maybeQuickviewButton}
            </div>
            {props?.item?.is_flash_sale === 1 && !isFinished && <div className={classes.endsInWrap}>
                <div className={classes.endsIn}>Ends in {hours}:{minutes}:{seconds}</div>
            </div>}
            <div className={classes.itemContent}>
                <Link
                    onClick={handleLinkClick}
                    to={productLink}
                    className={classes.name}
                >
                    <span>{name}</span>
                </Link>
                <div className={classes.price}>
                    {(item.special_price || price_range?.minimum_price?.final_price?.value) && !isFinished ? (
                        <Price
                            value={item.price_range?.minimum_price?.final_price?.value || item.special_price}
                            currencyCode={
                                price_range.maximum_price.regular_price.currency
                            }
                        />
                    ) : (
                        <Price
                            value={price_range.maximum_price.regular_price.value}
                            currencyCode={
                                price_range.maximum_price.regular_price.currency
                            }
                        />
                    )}
                </div>
                <div className={classes.discountWrapper}>
                    {(((item.stock_status !== "OUT_OF_STOCK" && item.special_price) ||
                        (price_range.maximum_price.discount.percent_off) || props?.item?.is_flash_sale === 1) && percent_off > 0) && !isFinished ? (
                        <>
                            <span className={classes.discountPrice}>
                                <Price
                                    value={
                                        price_range.maximum_price.regular_price
                                            .value
                                    }
                                    currencyCode={
                                        price_range.maximum_price.regular_price
                                            .currency
                                    }
                                />
                            </span>{' '}
                            <span className={classes.discountValue}>
                                -
                                <FormattedNumber
                                    maximumFractionDigits={0}
                                    value={
                                        price_range.maximum_price.discount
                                            .percent_off
                                    }
                                />
                                %
                            </span>
                        </>
                    ) : null}
                    {item.stock_status === "OUT_OF_STOCK" && props?.item?.is_flash_sale === 1 && <div className={classes.outOfStock}>Out of Stock</div>}
                    {
                        item.stock_status === "OUT_OF_STOCK" && props?.item?.is_flash_sale !== 1 && (
                            <p className={classes.oosTitle}>Out of Stock</p>
                        )
                    }
                </div>
                {
                    rating !== undefined && (
                        <div className={classes.ratingWrapper}>
                            <Rating
                                readonly
                                emptySymbol={
                                    <i
                                        className="fa fa-star"
                                        style={{
                                            color: '#D6D6D6',
                                            width: '12px',
                                            marginRight: '2px'
                                        }}
                                    />
                                }
                                fullSymbol={
                                    <i
                                        className="fa fa-star"
                                        style={{
                                            color: '#FFCF00',
                                            width: '12px',
                                            marginRight: '2px'
                                        }}
                                    />
                                }
                                initialRating={
                                    rating > 0 &&
                                        rating
                                        ? rating / 20
                                        : 0
                                }
                            />
                            <span>
                                {
                                    rating > 0 &&
                                        rating
                                        ? rating / 20
                                        : null
                                }
                            </span>
                        </div>
                    )
                }
                <ProductBadges badges={item?.offers} productLink={productLink} />
                {!props.disableAddToCart && addButton}
                <div className={classes.actionsContainer}>
                    {wishlistButton}
                    {/* {compareButton} */}
                </div>
            </div>
        </div>
    );
};

GalleryItem.propTypes = {
    classes: shape({
        image: string,
        imageLoaded: string,
        imageNotLoaded: string,
        imageContainer: string,
        images: string,
        name: string,
        price: string,
        root: string
    }),
    item: shape({
        id: number.isRequired,
        categories: arrayOf(
            shape({
                id: number,
                name: string.isRequired,
                level: number
            })
        ),
        name: string.isRequired,
        small_image: shape({
            url: string.isRequired
        }),
        stock_status: string.isRequired,
        type_id: string.isRequired,
        url_key: string.isRequired,
        url_suffix: string,
        sku: string.isRequired,
        price_range: shape({
            maximum_price: shape({
                regular_price: shape({
                    value: number.isRequired,
                    currency: string.isRequired
                }).isRequired
            }).isRequired
        }).isRequired
    }),
    storeConfig: shape({
        magento_wishlist_general_is_enabled: string.isRequired,
        product_url_suffix: string.isRequired
    }),
    disableAddToCart: bool
};

export default GalleryItem;
