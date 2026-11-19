import { gql } from '@apollo/client';

// 客户订单查询
export const GET_CUSTOMER_ORDERS = gql`
    query GetCustomerOrders($pageSize: Int!) {
        customer {
            id
            orders(pageSize: $pageSize) {
                items {
                    id
                    order_number
                    created_at
                    status
                    status_label
                    items {
                        quantity_ordered
                    }
                    total {
                        grand_total {
                            currency
                            value
                        }
                    }
                }
                total_count
                page_info {
                    current_page
                    total_pages
                }
            }
        }
    }
`;

// 订单详情查询
export const GET_TRACKING_ORDER = gql`
    query getTrackingOrder($email: String, $order_id: String) {
        ordersFilter(filters: { email: $email, ids: { eq: $order_id } }) {
            data {
                id
                order_number
                status
                status_label
                detail {
                    payment {
                        method
                        additional_information
                        payment_additional_info {
                            method_title
                            __typename
                        }
                        __typename
                    }
                    __typename
                    shipping_methods {
                        shipping_description
                        shipping_detail {
                            track_number
                            trackorder_type
                            data_detail
                            __typename
                        }
                        __typename
                    }
                    shipping_address {
                        firstname
                        lastname
                        city
                        street
                        postcode
                        region
                        __typename
                    }
                    items {
                        name
                        __typename
                    }
                    __typename
                }
                grand_total
                __typename
            }
        }
    }
`;

// 浮动横幅查询
export const GET_FLOATING_BANNER = gql`
    query getFloatingBanner($identifiers: [String]!) {
        cmsBlocks(identifiers: $identifiers) {
            items {
                content
                identifier
            }
        }
    }
`;