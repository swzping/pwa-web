import { useCallback, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import { ProductAlertNotifyInStockMutation } from './productNotifyMe.gql';

export const useProductNotifyMe = (props) => {
    const { item, view } = props;
    const [, { addToast }] = useToasts();

    const [
        addProductNotifyMe,
        { error: productAlertNotifyError, loading: productAlertNotifyInfo, data: productAlertNotifyData }
    ] = useMutation(ProductAlertNotifyInStockMutation);

    const handleSubmit = useCallback(
        async ({ email }) => {
            try {
                await addProductNotifyMe({
                    variables: {
                        email,
                        productId: item && item.id
                    }
                });
            } catch {
                return;
            }
        },
        [addProductNotifyMe, item?.id]
    );

    // message success or failed at customer hit button notify me
    useEffect(() => {
        if (productAlertNotifyData) {
            if (
                productAlertNotifyData.ProductAlertNotifyInStock.message
            ) {
                addToast({
                    type: 'info',
                    message:
                        productAlertNotifyData.ProductAlertNotifyInStock.message,
                    timeout: 5000
                });
            }
        }
    }, [addToast, productAlertNotifyData]);

    return {
        productAlertNotifyResponse: productAlertNotifyData && productAlertNotifyData.ProductAlertNotifyInStock,
        isDisableProductAlertNotify: Boolean(productAlertNotifyInfo),
        errorProductAlertNotify: productAlertNotifyError,
        handleSubmit
    };
};
