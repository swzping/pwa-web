import { gql } from '@apollo/client';
import { CheckoutPageFragment } from '@magento/peregrine/lib/talons/CheckoutPage/checkoutPageFragments.gql';

export const CREATE_ACCOUNT = gql`
    mutation CreateAccount(
        $email: String!
        $firstname: String!
        $lastname: String!
        $phonenumber: String
        $password: String!
        $otp: String
        $is_subscribed: Boolean
    ) {
        createCustomerCustom(
            input: {
                email: $email
                firstname: $firstname
                lastname: $lastname
                phonenumber: $phonenumber
                password: $password
                otp: $otp
                is_subscribed: $is_subscribed
            }
        ) {
            # The createCustomer mutation returns a non-nullable CustomerOutput type
            # which requires that at least one of the sub fields be returned.
            customer {
                id
            }
            status
            message
        }
    }
`;

export const REQUEST_OTP = gql`
    mutation requestOtp($phonenumber: String!) {
        requestOtpRegister(phonenumber: $phonenumber) {
            info
        }
    }
`;

export const OTP_CONFIG = gql`
    {
        otpConfig {
            otp_enable {
                enable_otp_forgot_password
                enable_otp_login
                enable_otp_register
            }
            otp_expired_time {
                expired_time_otp_forgot_password
                expired_time_otp_login
                expired_time_otp_register
            }
            otp_general_email_required
            otp_length {
                length_otp_forgot_password
                length_otp_login
                length_otp_register
            }
            otp_max_try {
                max_try_otp_forgot_password
                max_try_otp_login
                max_try_otp_register
            }
        }
    }
`;

export const GET_CUSTOMER = gql`
    query GetCustomerAfterCreate {
        customer {
            id
            email
            firstname
            lastname
            is_subscribed
        }
    }
`;

export const SIGN_IN = gql`
    mutation SignInAfterCreate($email: String!, $password: String!) {
        generateCustomerToken(email: $email, password: $password) {
            token
        }
    }
`;

export const CREATE_CART = gql`
    mutation CreateCartAfterAccountCreation {
        cartId: createEmptyCart
    }
`;

export const GET_CART_DETAILS = gql`
    query GetCartDetailsAfterAccountCreation($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            items {
                id
                prices {
                    price {
                        value
                    }
                }
                product {
                    id
                    name
                    sku
                    small_image {
                        url
                        label
                    }
                    price {
                        regularPrice {
                            amount {
                                value
                            }
                        }
                    }
                }
                quantity
                ... on ConfigurableCartItem {
                    configurable_options {
                        id
                        option_label
                        value_id
                        value_label
                    }
                }
            }
            prices {
                grand_total {
                    value
                    currency
                }
            }
        }
    }
`;

export const MERGE_CARTS = gql`
    mutation MergeCartsAfterAccountCreation(
        $sourceCartId: String!
        $destinationCartId: String!
    ) {
        mergeCarts(
            source_cart_id: $sourceCartId
            destination_cart_id: $destinationCartId
        ) @connection(key: "mergeCarts") {
            id
            items {
                id
            }
            ...CheckoutPageFragment
        }
    }
    ${CheckoutPageFragment}
`;

export default {
    createAccountMutation: CREATE_ACCOUNT,
    createCartMutation: CREATE_CART,
    getCartDetailsQuery: GET_CART_DETAILS,
    getCustomerQuery: GET_CUSTOMER,
    mergeCartsMutation: MERGE_CARTS,
    signInMutation: SIGN_IN,
    otpConfigQuery: OTP_CONFIG,
    requestOtpMutation: REQUEST_OTP
};
