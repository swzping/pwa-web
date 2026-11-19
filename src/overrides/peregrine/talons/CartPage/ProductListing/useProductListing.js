import { useEffect, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CartPage/ProductListing/productListing.gql';

import {
    impressionTracking,
    cartTracking
} from '../../../../../lib/ThirdPartyTracking';

/**
 * This talon contains logic for a component that renders a list of products for a cart.
 * It performs effects and returns prop data to render the component on a cart page.
 *
 * This talon performs the following effects:
 *
 * - Fetch product listing data associated with the cart
 * - Log any GraphQL errors to the console
 *
 * @function
 *
 * @param {Object} props
 * @param {ProductListingQueries} props.queries GraphQL queries for getting product listing data.
 *
 * @returns {ProductListingTalonProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { useProductListing } from '@magento/peregrine/lib/talons/CartPage/ProductListing/useProductListing';
 */
export const useProductListing = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getWishlistConfigQuery, getProductListingQuery } = operations;

    const [
        { cartId, isCartObsolete },
        {
            actions: { updateCartObsolete }
        }
    ] = useCartContext();

    const [activeEditItem, setActiveEditItem] = useState(null);

    const [
        fetchProductListing,
        { called, data, error, loading, refetch: refetchCartPage }
    ] = useLazyQuery(getProductListingQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        onCompleted: () => {
            if (isCartObsolete) updateCartObsolete(false);
        }
    });

    const { data: storeConfigData } = useQuery(getWishlistConfigQuery);

    const wishlistConfig = storeConfigData ? storeConfigData.storeConfig : {};

    useEffect(() => {
        if (cartId) {
            fetchProductListing({
                variables: {
                    cartId
                }
            });
        }
    }, [cartId, fetchProductListing]);

    let items = [];
    let tieringNudge = null;
    let currency = 'IDR';
    if (called && !error && !loading) {
        items = data.cart.items;
        tieringNudge = data.cart.tiering_nudge;
        // 后端新增字段 is_free_gift：为 true 时隐藏该商品
        // IDGUARD-1051 要求展示赠品
        // if (Array.isArray(items)) {
        //     items = items.filter(item => !item?.is_free_gift);
        // }
        // let relativeCategory = '';

        cartTracking(items);
    }

    // tracking if has crosssell products
    useEffect(() => {
        let crosssell = [];
        let relativeCategory = '';

        for (let index = 0; index < items.length; index++) {
            if (index === 0)
                currency = items[index].custom_price.row_total.currency;

            const data = items[index].product.crosssell_products.map(
                product => ({
                    ...product,
                    categories: items[index].product.categories
                })
            );
            crosssell = crosssell.concat(data);
        }

        impressionTracking(crosssell, relativeCategory, currency);
    }, [items.length]);

    return {
        activeEditItem,
        isLoading: loading,
        items,
        tieringNudge,
        setActiveEditItem,
        wishlistConfig,
        refetchCartPage
    };
};

/** JSDocs type definitions */

/**
 * GraphQL queries for getting product listing data.
 * This is a type used in the {@link useProductListing} talon.
 *
 * @typedef {Object} ProductListingQueries
 *
 * @property {GraphQLDocument} getProductListing Query to get the product list for a cart
 *
 * @see [productListingFragments.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/ProductListing/productListingFragments.js}
 * for the queries used in Venia
 */

/**
 * Object type returned by the {@link useProductListing} talon.
 * It provides props data for a component that renders a product list.
 *
 * @typedef {Object} ProductListingTalonProps
 *
 * @property {Object} activeEditItem The product item currently being edited
 * @property {boolean} isLoading True if the query to get the product listing is still in progress. False otherwise.
 * @property {Array<Object>} items A list of products in a cart
 * @property {function} setActiveEditItem Function for setting the current item to edit
 *
 */
