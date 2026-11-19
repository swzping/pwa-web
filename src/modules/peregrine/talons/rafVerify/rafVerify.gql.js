import { gql } from '@apollo/client';

export const rafVerifyMutation = gql`
    mutation rafVerify($referral_code: String!,   $cart_id: String!) {
        consumeReferralLink(
            referral_code: $referral_code
            cart_id: $cart_id
        ) {
            status
            message
        }
    }
`;