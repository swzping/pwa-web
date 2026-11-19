import { gql } from '@apollo/client';

export const GET_ORDER = gql`
    query getorder($order_number: String) {
        ordersFilter(filters: { ids: { eq: $order_number } }) {
            data {
                id
                status
                order_number
                grand_total
                detail {
                    tax_amount
                    aw_store_credit {
                        store_credit_amount
                    }
                    aw_giftcard {
                        giftcard_amount
                    }
                    aw_reward_points {
                        reward_points_amount
                    }
                    discount_amount
                    items {
                        sku
                        name
                        price
                        qty_ordered
                        categories {
                            name
                        }
                    }
                    tax_amount
                    payment {
                        shipping_amount
                    }
                }
                created_at
            }
        }
    }
`;

export const GET_ORDER_DETAIL = gql`
    query GetCustomerOrders($filter: CustomerOrdersFilterInput) {
    customer {
        orders(filter: $filter) {
            items {
                id
                status
                order_number
                grand_total
                detail {
                    tax_amount
                    aw_store_credit {
                        store_credit_amount
                        __typename
                    }
                    aw_giftcard {
                        giftcard_amount
                        __typename
                    }
                    aw_reward_points {
                        reward_points_amount
                        __typename
                    }
                    discount_amount
                    items {
                        sku
                        name
                        price
                        qty_ordered
                        categories {
                            name
                            __typename
                        }
                        __typename
                    }
                    tax_amount
                    payment {
                        shipping_amount
                        __typename
                    }
                    __typename
                }
                created_at
                __typename
            }
        }
    }
}
`;

export const getSnapOrderStatusByOrderIdQuery = gql`
    query($orderId: String!) {
        getSnapOrderStatusByOrderId(order_id: $orderId) {
            order_id
            status_message
            reorder_message
            reorder_status
            success
            cart_id
        }
    }
`;
