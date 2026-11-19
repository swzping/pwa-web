import { gql } from '@apollo/client';

export const GiftCardSummaryFragment = gql`
    fragment GiftCardSummaryFragment on Cart {
        id
        applied_giftcard {
            giftcard_amount
            giftcard_detail {
                giftcard_code
                giftcard_amount_used
            }
        }
    }
`;
