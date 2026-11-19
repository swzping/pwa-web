import { gql } from '@apollo/client';

const applied_giftcard = `
applied_giftcard {
    giftcard_amount
    giftcard_detail {
      giftcard_code
      giftcard_amount_used
    }
  }`;

export const GiftCardFragment = gql`
    fragment GiftCardFragment on Cart {
       ${applied_giftcard}
        id
    }
`;
