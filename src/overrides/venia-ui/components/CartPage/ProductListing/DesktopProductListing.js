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

/**
 * A child component of the CartPage component.
 * This component renders the product listing on the cart page.
 *
 * @param {Object} props
 * @param {Function} props.setIsCartUpdating Function for setting the updating state of the cart.
 * @param {Object} props.classes CSS className overrides.
 * See [productListing.css]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/ProductListing/productListing.css}
 * for a list of classes you can override.
 *
 * @returns {React.Element}
 *
 * @example <caption>Importing into your project</caption>
 * import ProductListing from "@magento/venia-ui/lib/components/CartPage/ProductListing";
 */
const DesktopProductListing = props => {
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

        return (
            <Fragment>
                <TieringNudge tieringNudge={tieringNudge} />
                <table style={{ width: '100%' }} className="hidden-mobile">
                    <thead>
                        <tr className={classes.tableHeader}>
                            <th />
                            <th>product</th>
                            <th />
                            <th>price</th>
                            <th>quantity</th>
                            <th>subtotal</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>{productComponents}</tbody>
                    {unavailableComponents.length ? (
                        <tbody>
                            <tr className={classes.tableUnavailableTitle}>
                                <td colSpan="6">
                                    {unavailableComponents.length} items not
                                    available
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className={classes.deleteAllButton}
                                    >
                                        Delete All
                                        <TrashOutlined />
                                    </button>
                                </td>
                            </tr>
                            <tr className={classes.tableUnavailableHeader}>
                                <td />
                                <td colSpan="5">Product</td>
                                <td />
                            </tr>
                            {unavailableComponents}
                        </tbody>
                    ) : null}
                </table>

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

export default DesktopProductListing;
