import { gql } from '@apollo/client';

export const GET_COUPONS_WALLET = gql`
query getCouponWallet(
  $pageSize: Int
  $currentPage: Int
  $status: String
) {
  customerCoupons(
    filter: {
      status: { eq: $status }
    }
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

export const SEARCH_COUPONS_WALLET = gql`
query CustomerCoupons(
  $filter: CouponFilterInput
  $pageSize: Int
  $currentPage: Int
) {
  customerCoupons(
    filter: $filter
    pageSize: $pageSize
    currentPage: $currentPage
  ) {
            items {
                uid
                name
                code
                description
                t_and_c
                image
                from_date
                to_date
                status
                is_claimed
                group
                __typename
            }
            currentPage
            pageSize
            totalCount
            __typename
        }
    }
`;

export const USE_COUPON = gql`
mutation useCoupon(
  $coupon: String!
) {
        useCoupon(coupon: $coupon) {
            items {
                uid
                name
                code
                description
                t_and_c
                image
                from_date
                to_date
                status
                should_claim
                is_claimed
                group
                __typename
            }
            __typename
        }
    }
`;

export const GET_OFFLINE_VOUCHERS = gql`
    query GetOfflineVouchers($filter: OfflineVoucherFilterInput, $pageSize: Int!, $currentPage: Int!) {
        offlineVouchers(filter: $filter, pageSize: $pageSize, currentPage: $currentPage) {
            items {
                uid
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
            }
            totalCount
            pageSize
            currentPage
        }
    }
`;

export const REDEEM_OFFLINE_VOUCHER = gql`
    mutation RedeemOfflineVoucher($uid: ID!) {
        redeemOfflineVoucher(uid: $uid) {
            uid
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
        }
    }
`;


export const GET_OFFLINE_VOUCHER_DETAIL = gql`
    query GetOfflineVoucher($uid: ID!) {
        offlineVoucher(uid: $uid) {
            uid
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
        }
    }
`;

export default {
    getCouponWallet: GET_COUPONS_WALLET,
    searchCouponWallet: SEARCH_COUPONS_WALLET,
    useCoupon: USE_COUPON,
    getOfflineVouchers: GET_OFFLINE_VOUCHERS,
    redeemOfflineVoucher: REDEEM_OFFLINE_VOUCHER,
    getOfflineVoucherDetail: GET_OFFLINE_VOUCHER_DETAIL,  
};
