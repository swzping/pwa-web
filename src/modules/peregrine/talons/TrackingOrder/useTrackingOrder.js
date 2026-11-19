import { useCallback, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_TRACKING_ORDER } from './trackingOrder.gql';

export const useTrackingOrder = () => {
    const [isTrackingOrder, setTrackingOrder] = useState(false);

    const [
        getTrackOrder,
        {
            data: trackingOrderData,
            loading: trackingOrderLoading,
            error: trackingOrderError
        }
    ] = useLazyQuery(GET_TRACKING_ORDER, {
        fetchPolicy: 'network-only'
    });

    const formApiRef = useRef(null);
    const setFormApi = useCallback(api => (formApiRef.current = api), []);

    const handleSubmit = useCallback(
        async ({ email, order_id }) => {
            try {
                await getTrackOrder({
                    variables: {
                        email,
                        order_id
                    }
                });

                setTrackingOrder(true);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }
            }
        },
        [getTrackOrder, isTrackingOrder]
    );

    return {
        setFormApi,
        handleSubmit,
        trackingOrderData,
        trackingOrderLoading,
        trackingOrderError
    };
};
