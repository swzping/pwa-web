import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';

import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CartPage/cartPage.gql';
import {
    consumeFromCheckoutFlag,
    peekFromCheckoutFlag
} from '@/helpers/cartAutoApplyVoucher';

/**
 * This talon contains logic for a cart page component.
 * It performs effects and returns prop data for rendering the component.
 *
 * This talon performs the following effects:
 *
 * - Manages the updating state of the cart while cart details data is being fetched
 *
 * @function
 *
 * @param {Object} props
 * @param {CartPageQueries} props.queries GraphQL queries
 *
 * @returns {CartPageTalonProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { useCartPage } from '@magento/peregrine/lib/talons/CartPage/useCartPage';
 */
export const useCartPage = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getCartDetailsQuery, resetAutoApplyVoucherMutation } = operations;

    // Only the CartPage opts in. The MiniCart (which reuses this talon) must
    // keep its current behavior and never consume the flag or run the reset.
    const { shouldResetAutoApplyVoucher = false } = props;

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();

    const [isCartUpdating, setIsCartUpdating] = useState(false);
    const [wishlistSuccessProps, setWishlistSuccessProps] = useState(null);
    const [resetAutoApplyVoucher] = useMutation(
        resetAutoApplyVoucherMutation
    );

    // Whether the auto-apply voucher reset must finish before cart data loads.
    // Initialized during the FIRST render (flag is only peeked, not consumed)
    // so the CartPage can block its children - and therefore all cart data
    // queries - until the reset resolves. Guests and "return from checkout"
    // visits start as false and render immediately, like today.
    const [isResettingAutoVoucher, setIsResettingAutoVoucher] = useState(
        shouldResetAutoApplyVoucher &&
            !peekFromCheckoutFlag() &&
            !!isSignedIn
    );

    const [fetchCartDetails, { called, data, loading }] = useLazyQuery(
        getCartDetailsQuery,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );

    const hasItems = !!(data && data.cart?.total_quantity);
    const shouldShowLoadingIndicator = called && loading && !hasItems;
    const totalItems = (data && data.cart?.total_quantity) ? data.cart?.total_quantity : 0;

    const cartItems = useMemo(() => {
        return (data && data.cart && data.cart.items) || [];
    }, [data]);

    const onAddToWishlistSuccess = useCallback(successToastProps => {
        setWishlistSuccessProps(successToastProps);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadCartDetails = () => {
            if (cartId) {
                fetchCartDetails({ variables: { cartId } });
            }
        };

        // Runs once per mount/focus (guarded by `called`).
        const run = async () => {
            // One-shot: only the CartPage consumes the flag, immediately after
            // reading it. If set, this is a "return from checkout" -> skip reset.
            const fromCheckout = shouldResetAutoApplyVoucher
                ? consumeFromCheckoutFlag()
                : true;

            // Pre-call: resetAutoApplyVoucher must complete BEFORE cart data is
            // fetched so the response reflects the reset state.
            if (!fromCheckout && isSignedIn && cartId) {
                setIsResettingAutoVoucher(true);
                try {
                    await resetAutoApplyVoucher({ variables: { cartId } });
                } catch (error) {
                    // Intentionally ignored: a failed reset must never block
                    // the cart page from loading its data.
                } finally {
                    if (!cancelled) {
                        setIsResettingAutoVoucher(false);
                    }
                }
            }

            if (!cancelled) {
                loadCartDetails();
            }
        };

        if (!called) {
            run();
        }

        // Let the cart page know it is updating while we're waiting on network data.
        setIsCartUpdating(loading);

        return () => {
            cancelled = true;
        };
    }, [
        called,
        cartId,
        fetchCartDetails,
        isSignedIn,
        loading,
        resetAutoApplyVoucher,
        shouldResetAutoApplyVoucher
    ]);

    return {
        cartItems,
        hasItems,
        totalItems,
        isCartUpdating,
        isResettingAutoVoucher,
        fetchCartDetails,
        onAddToWishlistSuccess,
        setIsCartUpdating,
        shouldShowLoadingIndicator,
        wishlistSuccessProps
    };
};

/** JSDoc type definitions */

/**
 * GraphQL formatted string queries used in this talon.
 *
 * @typedef {Object} CartPageQueries
 *
 * @property {GraphQLAST} getCartDetailsQuery Query for getting the cart details.
 * @property {GraphQLAST} resetAutoApplyVoucherMutation Mutation to reset the cart's
 *   auto-applied voucher state (pre-call before cart data is fetched).
 *
 * @see [cartPage.gql.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/cartPage.gql.js}
 * for queries used in Venia
 */

/**
 * Props data to use when rendering a cart page component.
 *
 * @typedef {Object} CartPageTalonProps
 *
 * @property {Array<Object>} cartItems An array of item objects in the cart.
 * @property {boolean} hasItems True if the cart has items. False otherwise.
 * @property {boolean} isCartUpdating True if the cart is updating. False otherwise.
 * @property {function} setIsCartUpdating Callback function for setting the updating state of the cart page.
 * @property {boolean} shouldShowLoadingIndicator True if the loading indicator should be rendered. False otherwise.
 */
