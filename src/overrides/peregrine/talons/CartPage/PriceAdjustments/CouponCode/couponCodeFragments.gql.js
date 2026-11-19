import { gql } from '@apollo/client';

export const AppliedCouponsFragment = gql`
    fragment AppliedCouponsFragment on Cart {
        id
        applied_coupons {
            code
            discount_amount
            is_free_gift_coupon
            is_cashback_coupon
            rule_name
            cashback_amount
        }
        applied_manual_coupon {
            coupon_code
            rule_id
        }
    }
`;
