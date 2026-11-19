import { gql } from '@apollo/client';

export const GET_COUPONS = gql`
query getCoupons(
  $pageSize: Int
  $currentPage: Int
) {
  coupons(
    pageSize: $pageSize
    currentPage: $currentPage
  ) {
    items {
      code
      name
      t_and_c
      image
      description
      from_date
      to_date
      group
      is_claimed
      status
      uid
      __typename
    }
    totalCount
    pageSize
    currentPage
    __typename
  }
}
`;

export const COLLECT_COUPON = gql`
mutation collectCoupon($couponCode: String!) {
  collectCoupon(couponCode: $couponCode)
}
`;

export default {
    getCoupons: GET_COUPONS,
    collectCouPon: COLLECT_COUPON
};

