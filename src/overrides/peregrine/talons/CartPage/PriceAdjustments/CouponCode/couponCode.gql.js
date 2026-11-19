import { gql } from '@apollo/client';
import { CartPageFragment } from '@magento/peregrine/lib/talons/CartPage/cartPageFragments.gql';
import { AppliedCouponsFragment } from './couponCodeFragments.gql';

const GET_APPLIED_COUPONS = gql`
    query getAppliedCoupons($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AppliedCouponsFragment
        }
    }
    ${AppliedCouponsFragment}
`;

const APPLY_COUPON_MUTATION = gql`
    mutation applyCouponToCart($cartId: String!, $couponCode: String!) {
        applyCouponToCart(
            input: { cart_id: $cartId, coupon_code: $couponCode }
        ) @connection(key: "applyCouponToCart") {
            cart {
                id
                ...CartPageFragment
                # If this mutation causes "free" to become available we need to know.
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;

const APPLY_MULTIPLE_COUPON_MUTATION = gql`
    mutation applyMultipleCoupon($cartId: String!, $couponCode: [String]) {
        applyMultipleCoupon(
            input: { cart_id: $cartId, couponCodes: $couponCode }
        ) @connection(key: "applyMultipleCoupon") {
            code
            isApplied
        }
    }
`;

const REMOVE_MULTIPLE_COUPON_MUTATION = gql`
    mutation applyMultipleCoupon($cartId: String!, $couponCode: [String]) {
        applyMultipleCoupon(
            input: { cart_id: $cartId, couponCodes: $couponCode }
        ) @connection(key: "applyMultipleCoupon") {
            code
            isApplied
        }
    }
`;

const REMOVE_COUPON_MUTATION = gql`
    mutation removeCouponFromCart($cartId: String!) {
        removeCouponFromCart(input: { cart_id: $cartId })
            @connection(key: "removeCouponFromCart") {
            cart {
                id
                ...CartPageFragment
                # If this mutation causes "free" to become available we need to know.
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;

export default {
    getAppliedCouponsQuery: GET_APPLIED_COUPONS,
    applyCouponMutation: APPLY_COUPON_MUTATION,
    removeCouponMutation: REMOVE_COUPON_MUTATION,
    applyMultipleCouponMutation: APPLY_MULTIPLE_COUPON_MUTATION,
    removeMultipleCouponMutation: REMOVE_MULTIPLE_COUPON_MUTATION
};
