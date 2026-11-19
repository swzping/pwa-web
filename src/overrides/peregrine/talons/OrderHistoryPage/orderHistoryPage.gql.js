import { gql } from '@apollo/client';

const CustomerOrdersFragment = gql`
    fragment CustomerOrdersFragment on CustomerOrders {
        items {
            order_number
            created_at
            shipping_method
            payment_methods { type name }
            status
            available_actions
            payment_countdown
            dfi_cancellation { canceled_by reason reason_note canceled_at }
            dfi_display_status { code label color return_status }
            pickup_store_address
            status_label
            items{
                quantity_ordered
            }
            total {
                discounts {
                    amount {
                        currency
                        value
                    }
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
        $filter: CustomerOrdersFilterInput
        $pageSize: Int!
        $currentPage: Int
    ) {
        customer {
            id
            orders(
                filter: $filter
                pageSize: $pageSize
                currentPage: $currentPage
            ) {
                ...CustomerOrdersFragment
            }
        }
    }
    ${CustomerOrdersFragment}
`;

export const GET_OFFLINE_ORDER_LIST = gql`
    query GetOfflineOrderList($input: OfflineOrderInput) {
        getOfflineOrderList(input: $input) {
            success
            code
            message
            data {
                page
                pageSize
                totalCount
                totalPage
                items {
                    receiptNo
                    storeName
                    timestamp
                    totalAmount
                    orderStatus
                    pdfUrl
                }
            }
        }
    }
`;

export const GET_REORDER_DATA = gql`
    mutation GetReorderData($orderId: String!) {
        reorder(input: { order_id: $orderId }) {
            cart_id
        }
    }
`;

export const GET_REORDER_ITEMS_DATA = gql`
    mutation ReorderItems($orderNumber: String!) {
        reorderItems(orderNumber: $orderNumber) {
            cart {
                id
                __typename
            }
            __typename
        }
    }
`;

export const CustomerOrdersDetailFragment = gql`
    fragment CustomerOrdersDetailFragment on CustomerOrders {
        items {
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
            order_number
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
                    __typename
                }
                aw_reward_points {
                    reward_points_amount
                    __typename
                }
                aw_store_credit {
                    store_credit_amount
                    __typename
                }
                __typename
            }
            comments {
                message
                timestamp
                __typename
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
                __typename
            }
            invoices {
                id
                __typename
            }
            items {
                id
                is_flash_sale_item
                is_gwp
                product_name
                product_sale_price {
                    currency
                    value
                    __typename
                }
                product_sku
                product_url_key
                selected_options {
                    label
                    value
                    __typename
                }
                quantity_ordered
                returnable_quantity
                return_together_key
                is_gift_with_purchase
                refundable_unit_price { value currency }
                entered_options {
                    label
                    value
                    __typename
                }
                ... on BundleOrderItem {
                    bundle_options {
                        label
                        values {
                            product_name
                            price {
                                currency
                                value
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                    __typename
                }
                __typename
            }
            order_number
            created_at
            payment_methods {
                name
                type
                additional_data {
                    name
                    value
                    __typename
                }
                __typename
            }
            shipments {
                id
                tracking {
                    number
                    __typename
                }
                __typename
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
                __typename
            }
            shipping_method
            status
            available_actions
            payment_countdown
            dfi_cancellation { canceled_by reason reason_note canceled_at }
            dfi_display_status { code label color return_status }
            pickup_store_address
            status_label
            total {
                discounts {
                    amount {
                        currency
                        value
                        __typename
                    }
                    __typename
                }
                student_discount{
                    currency
                    value
                    __typename
                }
                grand_total {
                    currency
                    value
                    __typename
                }
                loyalty_points {
                    point
                    loyalty_points_total {
                        currency
                        value
                    }
                    __typename
                }
                subtotal {
                    currency
                    value
                    __typename
                }
                total_shipping {
                    currency
                    value
                    __typename
                }
                total_tax {
                    currency
                    value
                    __typename
                }
                total_tp_discount {
                    currency
                    value
                    __typename
                }
                __typename
            }
            __typename
        }
        page_info {
            current_page
            total_pages
            __typename
        }
        total_count
        total_pages
        current_page
        __typename
    }
`

const GET_CUSTOMER_ORDERS_DETAIL = gql`
    query GetCustomerOrder($filter: CustomerOrdersFilterInput) {
        customer {
            orders(filter: $filter, scope: WEBSITE) {
                ...CustomerOrdersDetailFragment
                __typename
            }
            __typename
        }
    }
    ${CustomerOrdersDetailFragment}
`

export const GET_FREE_GIFTS_FOR_ORDER = gql`
    query getFreeGiftsForOrder($orderId: String!) {
        freeGiftsForOrder(order_id: $orderId) {
            id
            uid
            name
            sku
            stock_status
            stock_item {
                salable_qty
            }
            image {
                url
            }
            price {
                regularPrice {
                    amount {
                        value
                        currency
                    }
                }
            }
            __typename
        }
    }
`;

export default {
    getCustomerOrdersQuery: GET_CUSTOMER_ORDERS,
    getOfflineOrderListQuery: GET_OFFLINE_ORDER_LIST,
    getCustomerOrderDetail: GET_CUSTOMER_ORDERS_DETAIL,
    getFreeGiftsForOrder: GET_FREE_GIFTS_FOR_ORDER
};
