import { gql } from '@apollo/client';

export const getSnapTokenQuery = gql`
    query($orderId: String!) {
        getSnapTokenByOrderId(order_id: $orderId) {
            snap_token
        }
    }
`;

export const getSnapOrderStatusByOrderIdQuery = gql`
    query($orderId: String!) {
        getSnapOrderStatusByOrderId(order_id: $orderId) {
            order_id
            status_message
            success
            cart_id
        }
    }
`;

export const getSnapClientKeyQuery = gql`
    query {
        storeConfig {
            snap_client_key
            snap_is_production
            store_code
        }
    }
`;
