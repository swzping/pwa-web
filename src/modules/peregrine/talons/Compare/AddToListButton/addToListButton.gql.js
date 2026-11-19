import { gql } from '@apollo/client';

export const addProductsToCompareList = gql`
    mutation addProductsToCompareList($uid:ID!, $products:[ID]!){
        addProductsToCompareList(
          input: {
            uid: $uid,
            products: $products
          }
        ) {
          uid
          item_count
          attributes {
            code
            label
          }
          items {
            uid
            product {
              sku
              name
              description {
                html
              }
            }
          }
        }
    }
`;

export default {
    addProductsToCompareListMutation: addProductsToCompareList,
};