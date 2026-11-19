import { gql } from '@apollo/client';

export const AppliedStoreCreditFragment = gql`
    fragment AppliedStoreCreditFragment on Cart {
        applied_store_credit {
            is_use_store_credit
            store_credit_amount
        }
    }
`;
