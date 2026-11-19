import { gql } from '@apollo/client';
import { ProductListFragment } from './ProductList/productListFragments.gql';

export const MiniCartFragment = gql`
    fragment MiniCartFragment on Cart {
        id
        total_quantity
        prices {
            subtotal_with_discount_excluding_tax{
                value
                currency
            }
            discounts {
                amount {
                    value
                }
                label
            }
        }
        ...ProductListFragment
    }
    ${ProductListFragment}
`;