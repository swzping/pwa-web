import { gql } from '@apollo/client';

export const GET_PAYMENT_METHODS = gql`
    query getPaymentMethods($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            available_payment_methods {
                code
                title
            }
            selected_payment_method {
                code
            }
        }
    }
`;

export const SET_PAYMENT_METHOD_ON_CART = gql`
    mutation setPaymentMethodOnCart(
        $cartId: String!
        $paymentMethod: PaymentMethodInput!
    ) {
        setPaymentMethodOnCart(
            input: { cart_id: $cartId, payment_method: $paymentMethod }
        ) {
            cart {
                id
                selected_payment_method {
                    code
                    title
                }
            }
        }
    }
`;

export const GET_PAYMENT_CONFIG = gql`
    query getPaymentConfig {
        storeConfig {
            payments_configuration
            store_code
        }
    }
`;

export default {
    getPaymentMethodsQuery: GET_PAYMENT_METHODS,
    getPaymentConfigQuery: GET_PAYMENT_CONFIG,
    setPaymentMethodOnCartMutation: SET_PAYMENT_METHOD_ON_CART,
};
