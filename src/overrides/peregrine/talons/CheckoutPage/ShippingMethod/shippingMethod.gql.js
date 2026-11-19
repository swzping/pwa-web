import { gql } from '@apollo/client';

import { PriceSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/priceSummaryFragments.gql';
import { ShippingInformationFragment } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/shippingInformationFragments.gql';

import {
    AvailableShippingMethodsCheckoutFragment,
    SelectedShippingMethodCheckoutFragment
} from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/shippingMethodFragments.gql';

export const GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS = gql`
    query getSelectedAndAvailableShippingMethods($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AvailableShippingMethodsCheckoutFragment
            ...SelectedShippingMethodCheckoutFragment
            # We include the following fragments to avoid extra requeries
            # after this mutation completes. This all comes down to not
            # having ids for shipping address objects. With ids we could
            # merge results.
            ...ShippingInformationFragment
            shipping_addresses {
                available_shipping_methods {
                    amount_before_discount {
                        currency
                        value
                        __typename
                    }
                    discount_fee {
                        currency
                        value
                        __typename
                    }
                }
                selected_shipping_method {
                    amount_before_discount {
                        currency
                        value
                        __typename
                    }
                    discount_fee {
                        currency
                        value
                        __typename
                    }
                }
            }
        }
    }
    ${AvailableShippingMethodsCheckoutFragment}
    ${SelectedShippingMethodCheckoutFragment}
    ${ShippingInformationFragment}
`;

export const SET_SHIPPING_METHOD = gql`
    mutation SetShippingMethod(
        $cartId: String!
        $shippingMethod: ShippingMethodInput!
    ) {
        setShippingMethodsOnCart(
            input: { cart_id: $cartId, shipping_methods: [$shippingMethod] }
        ) @connection(key: "setShippingMethodsOnCart") {
            cart {
                id
                # If this mutation causes "free" to become available we need to know.
                available_payment_methods {
                    code
                    title
                }
                ...SelectedShippingMethodCheckoutFragment
                # We include the following fragments to avoid extra requeries
                # after this mutation completes. This all comes down to not
                # having ids for shipping address objects. With ids we could
                # merge results.
                ...AvailableShippingMethodsCheckoutFragment
            }
        }
    }
    ${AvailableShippingMethodsCheckoutFragment}
    ${SelectedShippingMethodCheckoutFragment}
`;

export const GET_AVAILABLE_SHIPPING_METHODS = gql`
    query getAvailableShippingMethods($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AvailableShippingMethodsCheckoutFragment
            shipping_addresses {
                available_shipping_methods {
                    amount_before_discount {
                        currency
                        value
                        __typename
                    }
                    discount_fee {
                        currency
                        value
                        __typename
                    }
                }
            }
        }
    }
    ${AvailableShippingMethodsCheckoutFragment}
`;

export default {
    setShippingMethodMutation: SET_SHIPPING_METHOD,
    getSelectedAndAvailableShippingMethodsQuery: GET_SELECTED_AND_AVAILABLE_SHIPPING_METHODS
};
