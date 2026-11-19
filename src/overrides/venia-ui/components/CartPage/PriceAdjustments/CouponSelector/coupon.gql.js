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

export const GET_COUPON_WALLET = gql`
query getCouponWallet(
  $pageSize: Int
  $currentPage: Int
) {
  customerCoupons(
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
   getCoupons:GET_COUPONS,
   getCouponWAllet:GET_COUPON_WALLET,
   collectCouPon:COLLECT_COUPON
};
