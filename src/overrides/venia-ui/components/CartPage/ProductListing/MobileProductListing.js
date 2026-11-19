import React, { Fragment, Suspense } from 'react';
import { useProductListing } from '@magento/peregrine/lib/talons/CartPage/ProductListing/useProductListing';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/CartPage/ProductListing/productListing.module.css';
import Product from '@magento/venia-ui/lib/components/CartPage/ProductListing/product';
import ProductListingShimmer from './productListing.shimmer';
import { getCartItemDisplayGroups } from '../../../../peregrine/util/getCartItemsWithFreeGifts';
import { TrashOutlined } from '@/assets/icons';
import TieringNudge from './tieringNudge';

const EditModal = React.lazy(() =>
    import('@magento/venia-ui/lib/components/CartPage/ProductListing/EditModal')
);

const isGamificationFreeGiftItem = item =>
    item?.is_gamification_free_gift === true ||
    item?.is_gamification_free_gift === 'true' ||
    item?.is_gamification_free_gift === 1 ||
    item?.is_gamification_free_gift === '1';

const MobileProductListing = props => {
    const {
        onAddToWishlistSuccess,
        setIsCartUpdating,
        fetchCartDetails,
        isCartUpdating,
        editMobile,
        isMiniCart,
        onCartQuantityChanged
    } = props;

    const talonProps = useProductListing();

    const {
        activeEditItem,
        items,
        isLoading,
        setActiveEditItem,
        tieringNudge,
        wishlistConfig,
        refetchCartPage
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);

    if (items.length) {
        const { availableItems, unavailableItems } = getCartItemDisplayGroups(
            items
        );
        const gamificationFreeGiftItems = items.filter(item => {
            return (
                isGamificationFreeGiftItem(item) &&
                !availableItems.some(
                    availableItem => availableItem.id === item.id
                )
            );
        });
        const displayItems = availableItems.concat(gamificationFreeGiftItems);

        const renderProduct = (product, isUnavailable = false) => (
            <Product
                item={product}
                key={product.id}
                isLoading={isLoading}
                setActiveEditItem={setActiveEditItem}
                setIsCartUpdating={setIsCartUpdating}
                onAddToWishlistSuccess={onAddToWishlistSuccess}
                fetchCartDetails={fetchCartDetails}
                wishlistConfig={wishlistConfig}
                isCartUpdating={isCartUpdating}
                editMobile={editMobile}
                refetchCartPage={refetchCartPage}
                isMobile={true}
                isMiniCart={isMiniCart}
                onCartQuantityChanged={onCartQuantityChanged}
                isUnavailable={isUnavailable}
            />
        );

        const productComponents = displayItems.map(product =>
            renderProduct(product)
        );
        const unavailableComponents = unavailableItems.map(product =>
            renderProduct(product, true)
        );
        const unavailableCount = unavailableItems.length;

        return (
            <Fragment>
                <ul className={classes.root}>
                    {productComponents}
                    {unavailableCount ? (
                        <li className={classes.mobileUnavailableSection}>
                            <div
                                className={classes.mobileUnavailableDivider}
                                aria-hidden="true"
                            />
                            <div className={classes.mobileUnavailableTitle}>
                                <span>
                                    {unavailableCount} items not supported
                                </span>
                                <button
                                    type="button"
                                    className={classes.deleteAllButton}
                                >
                                    Delete All
                                    <TrashOutlined />
                                </button>
                            </div>
                            <ul className={classes.mobileUnavailableList}>
                                {unavailableComponents}
                            </ul>
                        </li>
                    ) : null}
                </ul>
                {!isMiniCart ? (
                    <TieringNudge tieringNudge={tieringNudge} />
                ) : null}

                <Suspense fallback={null}>
                    <EditModal
                        item={activeEditItem}
                        setIsCartUpdating={setIsCartUpdating}
                        setActiveEditItem={setActiveEditItem}
                    />
                </Suspense>
            </Fragment>
        );
    }

    return null;
};

export default MobileProductListing;
