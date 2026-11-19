import { gql } from '@apollo/client';
import { CartPageFragment } from '@magento/peregrine/lib/talons/CartPage/cartPageFragments.gql';
import { AppliedStoreCreditFragment } from './storeCreditFragment.gql';

export const getAppliedStoreCreditQuery = gql`
    query($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AppliedStoreCreditFragment
        }
    }
    ${AppliedStoreCreditFragment}
`;

export const getStoreCreditQuery = gql`
    query {
        customer {
            store_credit {
                enabled
                current_balance {
                    currency
                    value
                }
            }
        }
    }
`;

export const applyStoreCreditMutation = gql`
    mutation($cartId: String!) {
        applyStoreCreditToCart(input: { cart_id: $cartId }) {
            cart {
                id
                ...CartPageFragment
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;

export const removeStoreCreditMutation = gql`
    mutation($cartId: String!) {
        removeStoreCreditFromCart(input: { cart_id: $cartId }) {
            cart {
                id
                ...CartPageFragment
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;
