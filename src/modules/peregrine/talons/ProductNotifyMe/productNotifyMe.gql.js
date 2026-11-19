import { gql } from '@apollo/client';

export const ProductAlertNotifyInStockMutation = gql`
    mutation ProductAlertNotifyInStock(
        $email: String!
        $productId: Int!
    ) {
        ProductAlertNotifyInStock(
            input: {
                email: $email
                product_id: $productId
            }
        ) {
            id
            message
        }
    }
`;

export const getEmailCustomer = gql`
    query {
        customer {
            email
        }
    }
`;

