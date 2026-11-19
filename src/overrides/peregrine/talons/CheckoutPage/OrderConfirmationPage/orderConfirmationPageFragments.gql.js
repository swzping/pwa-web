import { gql } from "@apollo/client";
import { ItemsReviewFragment } from "@magento/peregrine/lib/talons/CheckoutPage/ItemsReview/itemsReviewFragments.gql";

export const OrderConfirmationPageFragment = gql`
    fragment OrderConfirmationPageFragment on Cart {
        id
        email
        prices {
            applied_taxes {
                amount {
                    currency
                    value
                }
                label
            }
            grand_total {
                currency
                value
            }
        }
        selected_payment_method {
            code
            title
        }
        shipping_addresses {
            firstname
            lastname
            street
            city
            region {
                label
            }
            postcode
            country {
                label
            }
            selected_shipping_method {
                amount {
                    currency
                    value
                }
                carrier_title
                method_title
            }
        }
        total_quantity
        ...ItemsReviewFragment
    }
    ${ItemsReviewFragment}
`;
