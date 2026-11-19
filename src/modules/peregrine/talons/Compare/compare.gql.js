import { gql } from '@apollo/client';

export const getLocalCompareListProducts = gql`
    query getLocalCompareListProducts {
        localCompareListProducts @client
    }
`;

export const createCompareList = gql`
    mutation createCompareList($uid:[ID]){
      createCompareList(
          input: {
            products: $uid
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
                  id
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

export const mergeCommpareList = gql`
    mutation mergeCommpareList($uid: ID!) {
        assignCompareListToCustomer(uid: $uid) {
            result
            compare_list {
                uid
                item_count
                attributes {
                    code
                    label
                }
                items {
                    uid
                    product {
                        id
                        sku
                        name
                        description {
                            html
                        }
                    }
                }
            }
        }
    }
`;

export default {
    createCompareListMutation: createCompareList,
    getLocalCompareListProductsQuery: getLocalCompareListProducts,
    mergeCompareListMutation: mergeCommpareList,
};