import { gql } from '@apollo/client';
import { ShippingInformationFragment } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/shippingInformationFragments.gql';
import { ShippingMethodsCheckoutFragment } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/shippingMethodFragments.gql';
import { AvailablePaymentMethodsFragment } from '@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/paymentInformation.gql';
import { PriceSummaryFragment } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/priceSummaryFragments.gql';

export const GET_SHIPPING_INFORMATION = gql`
    query GetShippingInformation($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...ShippingInformationFragment
        }
    }
    ${ShippingInformationFragment}
`;

export const GET_DEFAULT_SHIPPING = gql`
    query GetDefaultShipping {
        customer {
            id
            default_shipping
        }
    }
`;

export const SET_CUSTOMER_ADDRESS_ON_CART = gql`
    mutation SetCustomerAddressOnCart($cartId: String!, $addressId: Int!) {
        setShippingAddressesOnCart(
            input: {
                cart_id: $cartId
                shipping_addresses: [{ customer_address_id: $addressId }]
            }
        ) @connection(key: "setShippingAddressesOnCart") {
            cart {
                id
                ...ShippingInformationFragment
            }
        }
    }
    ${ShippingInformationFragment}
`;

export const GET_APOTIK_LOCATION = gql`
    query {
        CustomLocationStore {
            loc_id
            loc_code
            loc_name
            loc_street
            loc_city
            loc_telephone
        }
    }
`;

export const SET_STORE_LOCATION = gql`
    mutation setStoreLocation($cartId: String!, $loc_code: String!, $store_address: String!) {
        setStoreLocation(
            input: {
                cart_id: $cartId
                loc_code: $loc_code
                store_address: $store_address
            }
        ) {
            cart {
                shipping_addresses {
                    street
                    available_shipping_methods {
                        carrier_code
                        carrier_title
                        method_code
                        method_title
                    }
                    selected_shipping_method {
                        carrier_code
                        carrier_title
                    }
                }
            }
        }
    }
`;

export default {
    setDefaultAddressOnCartMutation: SET_CUSTOMER_ADDRESS_ON_CART,
    getDefaultShippingQuery: GET_DEFAULT_SHIPPING,
    getShippingInformationQuery: GET_SHIPPING_INFORMATION
};
