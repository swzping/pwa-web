import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/MiniCart/miniCart.gql';
import { removeToCartTracking } from '../../../../lib/ThirdPartyTracking';

/**
 *
 * @param {Function} props.setIsOpen - Function to toggle the mini cart
 * @param {DocumentNode} props.operations.miniCartQuery - Query to fetch mini cart data
 * @param {DocumentNode} props.operations.removeItemMutation - Mutation to remove an item from cart
 *
 * @returns {
 *      closeMiniCart: Function,
 *      errorMessage: String,
 *      handleEditCart: Function,
 *      handleProceedToCheckout: Function,
 *      handleRemoveItem: Function,
 *      loading: Boolean,
 *      productList: Array<>,
 *      productListItems: Array<>,
 *      subTotal: Number,
 *      totalQuantity: Number
 *      configurableThumbnailSource: String
 *  }
 */
export const useMiniCart = props => {
    const { isOpen, setIsOpen, getCartCountCallback } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const {
        removeItemMutation,
        miniCartQuery,
        getStoreConfigQuery,
        resetAutoApplyVoucherMutation
    } = operations;

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();
    const history = useHistory();
    // 仅非 checkout 路由上的弹窗参与"自动选券 reset"。（MiniCart 组件在
    // /checkout 路由本就被 DENIED_MINI_CART_ROUTES 卸载，此判断为兜底。）
    const isCheckoutPage = !!useRouteMatch('/checkout');
    const [isLoading, setIsLoading] = useState(false);
    const [resetAutoApplyVoucher] = useMutation(
        resetAutoApplyVoucherMutation
    );

    // price 
    const { data: miniCartData, loading: miniCartLoading, refetch: refetchMiniCart } = useQuery(
        miniCartQuery,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            variables: { cartId },
            skip: !isSignedIn || !cartId,
            errorPolicy: 'all'
        }
    );
    const cartItems = miniCartData?.cart?.items;

    const isHasProductOOS = useMemo(() => {
        if (!miniCartLoading && Array.isArray(cartItems)) {
            return cartItems.some(
                item => item?.product?.stock_status === 'OUT_OF_STOCK'
            );
        }
        return false;
    }, [cartItems, miniCartLoading]);

    const isHasUnavailableSalableQty = useMemo(() => {
        if (!miniCartLoading && Array.isArray(cartItems)) {
            return cartItems.some(
                item =>
                    item?.__typename !== 'BundleCartItem' &&
                    item?.product?.stock_item?.salable_qty < item?.quantity
            );
        }
        return false;
    }, [cartItems, miniCartLoading]);


    getCartCountCallback && getCartCountCallback(miniCartData?.cart?.prices?.grand_total?.value);
    const { data: storeConfigData } = useQuery(getStoreConfigQuery, {
        fetchPolicy: 'cache-and-network'
    });

    const configurableThumbnailSource = useMemo(() => {
        return storeConfigData?.storeConfig?.configurable_thumbnail_source;
    }, [storeConfigData]);

    const storeUrlSuffix = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.product_url_suffix;
        }
    }, [storeConfigData]);

    const free_shipping_threshold = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.free_shipping_threshold;
        }
    }, [storeConfigData]);

    const [
        removeItem,
        {
            error: removeItemError
        }
    ] = useMutation(removeItemMutation);

    // minicart items
    const productListItems = useMemo(() => {
        if (!miniCartLoading && Array.isArray(cartItems)) {
            return cartItems;
        }
        return [];
    }, [cartItems, miniCartLoading]);

    const totalQuantity = useMemo(() => {
        if (!miniCartLoading && miniCartData) {
            return miniCartData.cart?.total_quantity;
        }
    }, [miniCartData, miniCartLoading]);

    const subTotal = useMemo(() => {
        if (!miniCartLoading && miniCartData) {
            return miniCartData.cart?.prices?.subtotal_with_discount_excluding_tax;
        }
    }, [miniCartData, miniCartLoading]);

    const discounts = useMemo(() => {
        if (!miniCartLoading && miniCartData) {
            return miniCartData.cart?.prices?.discounts;
        }
    }, [miniCartData, miniCartLoading]);

    const productList = useMemo(() => {
        if (!miniCartLoading && Array.isArray(cartItems)) {
            return cartItems;
        }
        return [];
    }, [cartItems, miniCartLoading]);

    const closeMiniCart = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleRemoveItem = useCallback(
        async (id, product, custom_price, quantity) => {
            try {
                await removeItem({
                    variables: {
                        cartId,
                        itemId: id
                    }
                });

                removeToCartTracking(id, product, custom_price, quantity);

                await refetchMiniCart();
            } catch (e) {
                // Error is logged by apollo link - no need to double log.
            }
        },
        [cartId, removeItem]
    );

    const handleProceedToCheckout = useCallback(() => {
        setIsOpen(false);
        // 整页加载进入 checkout，不走客户端路由。
        window.location.href = '/checkout';
    }, [setIsOpen]);

    const handleEditCart = useCallback(() => {
        setIsOpen(false);
        history.push('/cart');
    }, [history, setIsOpen]);

    const derivedErrorMessage = useMemo(
        () => deriveErrorMessage([removeItemError]),
        [removeItemError]
    );

    // 打开弹窗（已登录、非 checkout 页）时前置调用 resetAutoApplyVoucher 再
    // 刷新弹窗数据。fromCheckout 豁免只由购物车页消费（checkout 仅在卸载且
    // 目的地为 /cart 时打标），弹窗场景一律照常调用。
    // 失败兜底：任何错误都不能阻塞弹窗打开。
    const wasOpenRef = useRef(isOpen);
    useEffect(() => {
        const justOpened = isOpen && !wasOpenRef.current;
        wasOpenRef.current = isOpen;

        if (!justOpened || isCheckoutPage) {
            return;
        }

        let cancelled = false;

        (async () => {
            if (isSignedIn && cartId) {
                setIsLoading(true);
                try {
                    await resetAutoApplyVoucher({ variables: { cartId } });
                    if (!cancelled) {
                        await refetchMiniCart();
                    }
                } catch (error) {
                    // 忽略错误：不能阻塞弹窗打开
                } finally {
                    // cancelled 仅用于跳过已无意义的 refetch；loading 状态
                    // 始终恢复，避免弹窗在 reset 期间被关闭后 isLoading 残留，
                    // 导致下次打开一直显示骨架屏。
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        isOpen,
        isCheckoutPage,
        isSignedIn,
        cartId,
        resetAutoApplyVoucher,
        refetchMiniCart
    ]);

    return {
        closeMiniCart,
        errorMessage: derivedErrorMessage,
        handleEditCart,
        handleProceedToCheckout,
        handleRemoveItem,
        loading: isLoading || miniCartLoading,
        productList,
        productListItems,
        subTotal,
        totalQuantity,
        configurableThumbnailSource,
        storeUrlSuffix,
        free_shipping_threshold,
        discounts,
        isHasProductOOS,
        isHasUnavailableSalableQty
    };
};
