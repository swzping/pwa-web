import { useQuery } from '@apollo/client';
import useFieldState from '@magento/peregrine/lib/hooks/hook-wrappers/useInformedFieldStateWrapper';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/paymentMethods.gql';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useCartContext } from '@magento/peregrine/lib/context/cart';
// import { useState, useEffect } from 'react';

// const useFetchGql = (query) => {
//     const GRAPHQL_ENDPOINT = `${process.env.MAGENTO_BACKEND_URL}/graphql`
//     const [data, setData] = useState(null);
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchGqlData = async () => {
//             try {
//                 const response = await fetch(GRAPHQL_ENDPOINT, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         query,
//                     })
//                 });

//                 const result = await response.json();
//                 if (result?.data) {
//                     setData(result.data);
//                 } 
//                 else {
//                     setError(result?.errors || new Error('GraphQL error occurred'));
//                 }
//                 setLoading(false);
//             } catch (err) {
//                 setError(err);
//                 setLoading(false);
//             }
//         };

//         fetchGqlData();
//     }, []);

//     return { data, loading, error };
// };

// const GET_PAYMENT_CONFIG_QUERY = `
//     query getPaymentConfig {
//         storeConfig {
//             payments_configuration
//         }
//     }
// `;

export const usePaymentMethods = props => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getPaymentMethodsQuery, getPaymentConfigQuery } = operations;

    const [{ cartId }] = useCartContext();

    const { data, loading } = useQuery(getPaymentMethodsQuery, {
        skip: !cartId,
        variables: { cartId }
    });
    // const { data: dataPaymentConfig, loading: loadingPaymentConfig } = useFetchGql(GET_PAYMENT_CONFIG_QUERY);
    const { data: dataPaymentConfig, loading: loadingPaymentConfig } = useQuery(getPaymentConfigQuery, {
        skip: !cartId,
    });

    const { value: currentSelectedPaymentMethod } = useFieldState(
        'selectedPaymentMethod'
    );

    const availablePaymentMethods =
        (data && data.cart.available_payment_methods) || [];
    const paymentConfig = dataPaymentConfig?.storeConfig?.payments_configuration;

    // TODO: The front-end does not need to be checked by default when the back-end does not return
    // If selected payment is null then select it by default.
    // const defaultPaymentCode = availablePaymentMethods.find(({ code }) => code !== "purchaseorder")?.code || null;
    const selectedPaymentCode = (data && data.cart.selected_payment_method.code) || null;

    const initialSelectedMethod =
        selectedPaymentCode
            ? selectedPaymentCode
            : null;

    return {
        availablePaymentMethods,
        paymentConfig,
        currentSelectedPaymentMethod,
        initialSelectedMethod,
        isLoading: loading || loadingPaymentConfig,
    };
};
