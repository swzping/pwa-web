import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { markFromCart } from '@/helpers/cartAutoApplyVoucher';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from './priceSummary.gql';

/**
 * @ignore
 *
 * Flattens query data into a simple object. We create this here rather than
 * having each line summary line component destructure its own data because
 * only the parent "price summary" component knows the data structure.
 *
 * @param {Object} data query data
 */
const flattenData = data => {
    if (!data) return {};
    return {
        subtotal: data.cart.prices.subtotal_excluding_tax,
        total: data.cart.prices.grand_total,
        discounts: data.cart.prices.discounts,
        promotions: data.cart.prices.promotions,
        giftCards: data.cart.applied_giftcard,
        taxes: data.cart.prices.applied_taxes,
        shipping: data.cart.shipping_addresses,
        rewardPoints: data.cart.applied_reward_points,
        storeCredits: data.cart.applied_store_credit,
        // selectedPayment: data.cart.selected_payment_method.code,
        awRaf: data.cart.prices.aw_raf_discount,
        subtotalAfterDiscounts: data.cart.prices.subtotal_after_discounts,
        loyalty_points: data.cart.prices.loyalty_points
    };
};

/**
 * This talon contains logic for a price summary component.
 * It performs effects and returns prop data for rendering the component.
 *
 * This talon performs the following effects:
 *
 * - Log a GraphQL error if it occurs when getting the price summary
 *
 * @function
 *
 * @param {Object} props
 * @param {PriceSummaryQueries} props.queries GraphQL queries for a price summary component.
 *
 * @returns {PriceSummaryTalonProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { usePriceSummary } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/usePriceSummary';
 */
export const usePriceSummary = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getPriceSummaryQuery, getPriceSummaryQueryCart } = operations;
    const { loadingRefetchDataCart, setLoadingRefetchDataCart, totalItems } = props;

    const [{ cartId }] = useCartContext();
    // We don't want to display "Estimated" or the "Proceed" button in checkout.
    const match = useRouteMatch('/checkout');
    const isCheckout = !!match;

    const [isLoading, setIsLoading] = useState(false);

    const cartPage = useRouteMatch('/cart');
    const isCartPage = !!cartPage;
    const { error, loading, data, refetch: refetchDataSummary } = isCartPage
        ? useQuery(getPriceSummaryQueryCart, {
            fetchPolicy: 'network-only',
            // fetchPolicy: 'cache-and-network', // default pwa studio
            // nextFetchPolicy: 'cache-first', // default pwa studio
            skip: !cartId,
            variables: {
                cartId
            }
        })
        : useQuery(getPriceSummaryQuery, {
            fetchPolicy: 'network-only',
            // fetchPolicy: 'cache-and-network', // default pwa studio
            // nextFetchPolicy: 'cache-first', // default pwa studio
            skip: !cartId,
            variables: {
                cartId
            }
        });

    // MiniCart 抽屉与购物车页的"checkout"按钮都走 handleProceedToCheckout。
    const [{ isSignedIn }] = useUserContext();

    const handleProceedToCheckout = useCallback(() => {
        // 这两个语境下购物车数据已前置 reset（MiniCart 弹窗打开时、
        // CartPage 进店时），打 fromCart 标记让 checkout 跳过本次
        // resetAutoApplyVoucher。游客未执行过 reset 不打标（避免
        // GuestSignIn 场景误跳过）；checkout 页上按钮本就不渲染，
        // !isCheckout 防御性避免标记无人消费。
        if (isSignedIn && !isCheckout) {
            markFromCart();
        }
        // 整页加载进入 checkout（不走 react-router），保证 checkout 页完全
        // 重新初始化。fromCart 标记已迁移到 sessionStorage，可跨整页刷新存活。
        window.location.href = '/checkout';
    }, [isCheckout, isSignedIn]);

    useEffect(() => {
        if (loadingRefetchDataCart) {
            refetchDataSummary();
            if (window.innerWidth >= 1024) {
                setLoadingRefetchDataCart(false);
            }
        }
    }, [loadingRefetchDataCart]);

    const itemsLength = useMemo(() => {
        return (data && data.cart && data.cart?.total_quantity) || undefined;
    }, [data]);

    // if totalItems value on useCartPage is not equal to itemsLength
    // isLoading should be true, it means refetchDataSummary is calling
    useEffect(() => {
        if (typeof totalItems !== 'undefined' && (totalItems !== itemsLength)) {
            setIsLoading(true);
        } else {
            setIsLoading(false);
        }
    }, [totalItems, itemsLength])

    const isHasProductOOS = useMemo(() => {
        if (isCartPage && !loading && data) {
            if (data.cart.items.some(item => item.product.stock_status === "OUT_OF_STOCK")) {
                return true;
            }
        }
    }, [data, loading]);

    const isHasUnavailableSalableQty = useMemo(() => {
        if (isCartPage && !loading && data) {
            if (data.cart.items.some(item => item.product.stock_item.salable_qty < item.quantity && item.__typename !== "BundleCartItem")) {
                return true;
            }
        }
    }, [data, loading]);

    return {
        handleProceedToCheckout,
        hasError: !!error,
        hasItems: data && !!data.cart?.total_quantity,
        isCheckout,
        isLoading: !!loading || isLoading,
        flatData: flattenData(data),
        isHasProductOOS,
        isHasUnavailableSalableQty
    };
};

/** JSDocs type definitions */

/**
 * Query data flattened into a simple object.
 *
 * @typedef {Object} FlattenedData
 *
 * @property {String} subtotal Cart subtotal (excluding tax)
 * @property {String} total Cart grand total
 * @property {Array<Object>} discounts Discounts applied to the cart
 * @property {Array<Object>} giftCards Gift cards applied to the cart
 * @property {Array<Object>} taxes Taxes applied to the cart
 * @property {Array<Object>} shipping Shipping addresses associated with this cart
 */

/**
 * GraphQL queries for price summary component.
 *
 * @typedef {Object} PriceSummaryQueries
 *
 * @property {GraphQLAST} getPriceSummary Query to get the price summary for a cart
 *
 * @see [priceSummary.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceSummary/priceSummary.js}
 * for the queries used in Venia.
 */

/**
 * Props used for rendering a price summary component.
 *
 * @typedef {Object} PriceSummaryTalonProps
 *
 * @property {function} handleProceedToCheckout Callback function which navigates the browser to the checkout
 * @property {boolean} hasError True if a GraphQL query returns an error. False otherwise.
 * @property {boolean} hasItems True if the cart has any items. False otherwise.
 * @property {boolean} isLoading True while the GraphQL query is still in flight. False otherwise.
 * @property {FlattenedData} flatData Query data that has been flattened into a simple object
 *
 */
