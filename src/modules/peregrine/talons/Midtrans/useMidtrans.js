import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/checkoutPage.gql.js';
import * as midtransSchema from './midtrans.gql';

export const useMidtrans = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const [snapClosed, setSnapClosed] = useState(false);

    const [, { removeCart }] = useCartContext();

    const { placeOrderMutation } = operations;

    const [
        placeOrder,
        {
            data: placeOrderData,
            error: placeOrderError,
            loading: placeOrderLoading
        }
    ] = useMutation(placeOrderMutation);

    const [getSnapToken, manageSnapToken] = useLazyQuery(
        midtransSchema.getSnapTokenQuery
    );
    const [getSnapOrderStatusByOrderId, snapStatus] = useLazyQuery(
        midtransSchema.getSnapOrderStatusByOrderIdQuery
    );

    const {
        data: snapClientKeyData,
        loading: snapClientKeyLoading,
        error: snapClientKeyError
    } = useQuery(midtransSchema.getSnapClientKeyQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const errors = useMemo(
        () => new Map([['getSnapClientKeyQuery', snapClientKeyError]]),
        [snapClientKeyError]
    );

    const handleGetSnapToken = useCallback(async orderNumber => {
        try {
            await getSnapToken({
                variables: { orderId: orderNumber }
            });
        } catch (error) {
            // error
        }
    }, []);

    // Start - Manage Snap Pop Up When Opened (Waiting Response From SnapToken)
    const lastSnapTokenRef = useRef(null);
    const manageSnapTokenData = manageSnapToken && manageSnapToken.data;

    useEffect(() => {
        const snapToken =
            manageSnapTokenData &&
            manageSnapTokenData.getSnapTokenByOrderId &&
            manageSnapTokenData.getSnapTokenByOrderId.snap_token;

        // snap.pay must run exactly once per snap token: calling it again
        // while the Snap popup is already open throws "Invalid state
        // transition from PopupInView to PopupInView" and crashes the
        // CheckoutPage render tree. The ref gate is synchronous, so
        // re-renders between popup open and popup close cannot re-enter.
        if (
            lastSnapTokenRef.current === snapToken ||
            !snapToken ||
            !snap ||
            !snap.pay
        ) {
            return;
        }
        lastSnapTokenRef.current = snapToken;

        snap.pay(snapToken, {
            async onSuccess() {
                removeCart();
                window.location.href = `/thanks/order?number=${
                    placeOrderData.placeOrder.order.order_number
                }`;
            },
            async onPending() {
                removeCart();
                window.location.href = `/thanks/order?number=${
                    placeOrderData.placeOrder.order.order_number
                }`;
                // window.location.replace(generatesuccessRedirect(orderId));
            },
            async onError() {
                // getSnapOrderStatusByOrderId({
                //     variables: {
                //         orderId:
                //             placeOrderData.placeOrder.order.order_number
                //     }
                // });

                removeCart();
                window.location.href = `/thanks/order?number=${
                    placeOrderData.placeOrder.order.order_number
                }&status=failed`;
            },
            async onClose() {
                // console.log('onclose')
                // getSnapOrderStatusByOrderId({
                //     variables: {
                //         orderId:
                //             placeOrderData.placeOrder.order.order_number
                //     }
                // });

                removeCart();
                window.location.href = `/thanks/order?number=${
                    placeOrderData.placeOrder.order.order_number
                }&status=failed`;
            }
        });
    }, [manageSnapTokenData, removeCart, placeOrderData]);

    // if (manageSnapToken.error && orderId) {
    //     // window.location.replace(generateCartRedirect(orderId));
    // }
    // End - Manage Snap Pop Up When Opened (Waitinge Response From SnapToken)

    //  Start - Process Snap Pop Up Close (Waitinge Response From Reorder)
    // if (snapStatus.data && !snapClosed) {
    //     const { cart_id } = snapStatus.data.getSnapOrderStatusByOrderId;
    //     saveCartId(cart_id);

    //     setSnapClosed(true);
    //     // window.location.href = '/cart';
    //     window.location.href = `/thanks/order?number=${
    //         placeOrderData.placeOrder.order.order_number
    //     }`;
    // }
    // End - Process Snap Pop Up Close (Waitinge Response From Reorder)

    return {
        handleGetSnapToken,
        snapClient: snapClientKeyData && snapClientKeyData,
        snapClientLoading: snapClientKeyLoading,
        errors,
        placeOrder,
        placeOrderData,
        placeOrderError,
        placeOrderLoading
    };
};
