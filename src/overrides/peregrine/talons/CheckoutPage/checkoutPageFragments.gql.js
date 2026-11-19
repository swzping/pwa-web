import { gql } from '@apollo/client';

export const CheckoutPageFragment = gql`
    fragment CheckoutPageFragment on Cart {
        id
        items {
            id
            uid
            product {
                id
                uid
                categories {
                    id
                    uid
                    name
                    level
                }
                name
                sku
                stock_status
            }
            prices {
                price {
                    currency
                    value
                }
            }
            is_free_gift
            quantity
        }
        # If total quantity is falsy we render empty.
        total_quantity
        available_payment_methods {
            code
        }
    }
`;
