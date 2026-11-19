import { gql } from '@apollo/client';

export const AppliedRewardPointFragment = gql`
    fragment AppliedRewardPointFragment on Cart {
        applied_reward_points {
            is_use_reward_points
            reward_points_amount
        }
    }
`;
