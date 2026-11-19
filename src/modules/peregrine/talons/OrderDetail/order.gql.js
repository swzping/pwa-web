import { gql } from '@apollo/client';

const CustomerOrdersFragment = gql`
    fragment CustomerOrdersFragment on CustomerOrders {
        items {
            promotions {
                amount {
                    currency
                    value
                    __typename
                }
                label
                __typename
            }
            detail {
                discount_amount
                aw_giftcard {
                    giftcard_amount
                }
                aw_reward_points {
                    reward_points_amount
                }
                aw_store_credit {
                    store_credit_amount
                }
            }
            comments {
                message
                timestamp
            }
            billing_address {
                city
                country_code
                firstname
                lastname
                postcode
                region
                street
                telephone
            }
            id
            returns {
                items {
                    uid
                    created_at
                    display_status
                    solution { code label }
                    reason { label }
                    reason_other_text
                }
            }
            return_eligibility {
                solutions
                reason_uids
                can_return
                message
            }
            invoices {
                id
            }
            items {
                id
                is_flash_sale_item
                product_name
                product_sale_price {
                    currency
                    value
                }
                product_sku
                product_url_key
                selected_options {
                    label
                    value
                }
                quantity_ordered
                returnable_quantity
                return_together_key
                is_gift_with_purchase
                refundable_unit_price { value currency }
                entered_options{
                    label
                    value
                }
                ... on BundleOrderItem {
                    bundle_options {
                      label
                      values {
                        product_name
                        price {
                          currency
                          value
                        }
                      }
                    }
                }
            }
            order_number
            created_at
            payment_methods {
                name
                type
                additional_data {
                    name
                    value
                }
            }
            shipments {
                id
                tracking {
                    number
                }
            }
            shipping_address {
                city
                country_code
                firstname
                lastname
                postcode
                region
                street
                telephone
            }
            shipping_method
            status
            available_actions
            payment_countdown
            dfi_cancellation { canceled_by reason reason_note canceled_at }
            dfi_display_status { code label color return_status }
            pickup_store_address
            total {
                discounts {
                    amount {
                        currency
                        value
                    }
                }
                student_discount{
                    currency
                    value
                    __typename
                }
                grand_total {
                    currency
                    value
                }
                subtotal {
                    currency
                    value
                }
                total_shipping {
                    currency
                    value
                }
                total_tax {
                    currency
                    value
                }
                total_tp_discount {
                    currency
                    value
                }
                loyalty_points {
                    point
                    loyalty_points_total {
                        currency
                        value
                    }
                    __typename
                }
            }
        }
        page_info {
            current_page
            total_pages
        }
        total_count
        total_pages
        current_page
    }
`;

export const GET_CUSTOMER_ORDERS = gql`
    query GetCustomerOrders(
        $filter: CustomerOrdersFilterInput,
    ) {
        customer {
            id
            orders(pageSize: 10, filter: $filter, scope: WEBSITE) {
                ...CustomerOrdersFragment
            }
        }
    }
    ${CustomerOrdersFragment}
`;

export default {
    getCustomerOrdersQuery: GET_CUSTOMER_ORDERS
};
