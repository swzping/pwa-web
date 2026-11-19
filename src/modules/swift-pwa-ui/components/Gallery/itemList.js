import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Info } from 'react-feather';
import { Link } from 'react-router-dom';
import { string, number, shape } from 'prop-types';
import Price from '@magento/venia-ui/lib/components/Price';
import { UNCONSTRAINED_SIZE_KEY } from "@magento/peregrine/lib/talons/Image/useImage";
import { useGalleryItem } from '../../../../overrides/peregrine/talons/Gallery/useGalleryItem';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Image from '@magento/venia-ui/lib/components/Image';
import GalleryItemShimmer from '@magento/venia-ui/lib/components/Gallery/item.shimmer';
import WishlistGalleryButton from '@magento/venia-ui/lib/components/Wishlist/AddToListButton';

import CompareGalleryButton from '../Compare/AddToListButton';
import DiscountRibbon from '../DiscountRibbon';
import AddToCart from './addToCart';
// import ProductBadges from './productBadges';
import defaultClasses from './itemList.module.css';

const IMAGE_WIDTH = 200;

const IMAGE_WIDTHS = new Map()
    .set(640, 100)
    .set(UNCONSTRAINED_SIZE_KEY, IMAGE_WIDTH);

const ItemList = props => {
    const {
        compareListButtonProps,
        handleLinkClick,
        item,
        wishlistButtonProps,
        isSupportedProductType
    } = useGalleryItem(props);

    const { storeConfig, onAddToCartSuccess = () => {}, itemGalleryRef = null } = props;

    const productUrlSuffix = storeConfig && storeConfig.product_url_suffix;

    const classes = useStyle(defaultClasses, props.classes);

    if (!item) {
        return <GalleryItemShimmer classes={classes} />;
    }

    const { name, price_range, small_image, url_key, variant_parent_url, variant_parent_url_key, variant_parent_url_suffix } = item;
    const { url: smallImageURL } = small_image;
    const itemUrlPath = variant_parent_url || `${variant_parent_url_key || url_key}${variant_parent_url_suffix || productUrlSuffix || ''}`;
    const variantPreselectedOptions = Array.isArray(item.variant_preselected_options)
        ? item.variant_preselected_options
        : [];
    const itemLink = resourceUrl(
        `/${itemUrlPath}${
            item.variant_parent_sku && variantPreselectedOptions.length
                ? `?selected_options=${variantPreselectedOptions.map(encodeURIComponent).join(',')}`
                : ''
        }`
    );

    // app ProductItem parity — discount ribbon overlay, driven by
    // the discount_percentage attribute
    const showDiscountRibbon = Number(item.discount_percentage) > 0;

    const addToCart = isSupportedProductType ? (
        <AddToCart
            productData={item}
            productLink={itemLink}
            alwaysInline
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

    const wishlistButton = wishlistButtonProps ? (
        <WishlistGalleryButton {...wishlistButtonProps} />
    ) : null;

    const compareButton = wishlistButtonProps ? (
        <CompareGalleryButton {...compareListButtonProps} />
    ) : null;

    return (
        <div className={classes.root} ref={itemGalleryRef}>
            <div className={classes.item}>
                <Link
                    onClick={handleLinkClick}
                    to={itemLink}
                    className={classes.imageContainer}
                    style={{ position: 'relative' }}
                >
                    {showDiscountRibbon && (
                        <div style={{ position: 'absolute', top: 8, left: 8, margin: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                            <DiscountRibbon percent={item.discount_percentage} width={32} />
                        </div>
                    )}
                    <Image
                        alt={name}
                        classes={{
                            root: classes.imageRoot,
                            image: classes.image
                        }}
                        widths={IMAGE_WIDTHS}
                        resource={smallImageURL}
                    />
                </Link>
                <div className={classes.details}>
                    <div className={classes.name}>
                        <Link to={itemLink}>{name}</Link>
                    </div>
                    {/* <ProductBadges badges={item?.product?.offers} /> */}
                    <span className={classes.price}>
                        <Price
                            value={price_range.maximum_price.regular_price.value}
                            currencyCode={
                                price_range.maximum_price.regular_price.currency
                            }
                        />
                    </span>
                    <span className={classes.add_to_cart}>
                        {' '}
                        {addToCart}
                    </span>
                </div>
                <div className={classes.actions}>
                    {wishlistButton}
                    {compareButton}
                </div>
            </div>
        </div>
    );
};

ItemList.propTypes = {
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
    })
};

export default ItemList;
