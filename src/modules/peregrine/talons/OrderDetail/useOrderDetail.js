import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CUSTOMER_ORDERS } from './order.gql';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { GET_REORDER_ITEMS_DATA } from '../../../../overrides/peregrine/talons/OrderHistoryPage/orderHistoryPage.gql';
import { saveCartId } from '@magento/peregrine/lib/store/actions/cart/asyncActions';
import { useToasts } from '@magento/peregrine';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import Icon from '@magento/venia-ui/lib/components/Icon';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

export const useOrderDetail = (props = {}) => {
    const { number } = props;
    const [reorderLoading, setReorderLoading] = useState(false);
    const [, { addToast }] = useToasts();

    const { data, loading, error: getOrderError } = useQuery(GET_CUSTOMER_ORDERS, {
        fetchPolicy: 'cache-and-network',
        variables: {
            filter: { number: { eq: `${number}` } },
        },
        skip: !number
    });

    const derivedErrorMessage = useMemo(
        () => deriveErrorMessage([getOrderError]),
        [getOrderError]
    );

    const [
        reOrder,
        { called: applyReorderCalled, loading: appliyingReorder }
    ] = useMutation(GET_REORDER_ITEMS_DATA);

    useEffect(() => {
        if (applyReorderCalled) {
            setReorderLoading(appliyingReorder);
        }
    }, [applyReorderCalled, appliyingReorder, setReorderLoading]);

    // handle reorder Click
    const handleReorder = async orderId => {
        try {
            const { data } = await reOrder({
                variables: {
                    orderNumber: orderId
                }
            });
            const cartId = data?.reorderItems?.cart?.id
            if(cartId){
                saveCartId(cartId);
                window.location.href = '/cart';
            }
        } catch (error) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: 'update failed',
                dismissable: true,
                timeout: 10000
            });
        }
    };

    return {
        data,
        loading,
        errorMessage: derivedErrorMessage,
        handleReorder,
        reorderLoading
    };
};
