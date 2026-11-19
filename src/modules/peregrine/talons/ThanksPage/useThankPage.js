import React, { useCallback, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import { useHistory } from 'react-router-dom';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { saveCartId } from '@magento/peregrine/lib/store/actions/cart/asyncActions';
import {
    GET_ORDER_DETAIL,
    getSnapOrderStatusByOrderIdQuery
} from './thankspage.gql';
import { orderSuccess, usageCoupon } from '../../../../lib/ThirdPartyTracking';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);
export const useThankPage = props => {
    const { orderNumber } = props;
    const [, { addToast }] = useToasts();
    const history = useHistory();

    const { data, loading } = useQuery(GET_ORDER_DETAIL, {
        variables: {
            filter: {
                number: { eq: orderNumber }
            }
        }
    });

    const [getSnapOrderStatusByOrderId, snapStatus] = useLazyQuery(
        getSnapOrderStatusByOrderIdQuery
    );

    const handleReorderSuccess = cartId => {
        saveCartId(cartId);
        window.location.href = '/cart';
    };

    const handleReorderFail = message => {
        let delay = 0;
        if (message !== 'success') {
            delay = 3000;
            addToast({
                type: 'error',
                icon: errorIcon,
                message: message || 'Reorder failed',
                dismissable: true,
                timeout: 3000
            });
        }
        setTimeout(() => {
            history.push('/order-history');
        }, delay);
    };

    const handleReorder = useCallback(async () => {
        try {
            const { data } = await getSnapOrderStatusByOrderId({
                variables: {
                    orderId: orderNumber
                }
            });
            const { cart_id, reorder_message, reorder_status } =
                data?.getSnapOrderStatusByOrderId || {};
            if (reorder_status) {
                handleReorderSuccess(cart_id);
            } else {
                handleReorderFail(reorder_message);
            }
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(err);
            }
            handleReorderFail(err);
            // setCompleted(false);
        }
    }, [getSnapOrderStatusByOrderId]);

    const hasData = !!data?.customer?.orders?.items[0];
    const shouldShowLoadingIndicator = !hasData && loading;
    const orderData = data?.customer?.orders?.items[0] || {};

    useEffect(() => {
        if (orderData && orderData.detail) {
            orderSuccess(
                orderData.order_number,
                orderData.grand_total,
                orderData.detail[0].tax_amount,
                orderData.detail[0].payment.shipping_amount,
                orderData.detail[0].items,
                orderData
            );
            usageCoupon(
                orderData.order_number,
                orderData.detail[0].discount_amount,
                orderData.detail[0].aw_giftcard.giftcard_amount,
                orderData.detail[0].aw_reward_points.reward_points_amount,
                orderData.detail[0].aw_store_credit.store_credit_amount
            );
        }
    }, [orderData]);

    return {
        shouldShowLoadingIndicator,
        orderData,
        handleReorder,
        snapStatus
    };
};
