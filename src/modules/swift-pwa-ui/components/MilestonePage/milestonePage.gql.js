import { gql } from '@apollo/client';

export const GET_GAMIFICATION_CAMPAIGN = gql`
    query GetGamificationCampaign {
        gamificationCampaign {
            campaign_progress_status
            banner_url
            tasks {
            label
            status
            icon
            action_link
            task_type
            }
            is_reward_claimed
        }
    }
`

export const CLAIM_GAMIFICATION_VOUCHER = gql`
    mutation ClaimGamificationVoucher {
        claimGamificationVoucher {
            success
            message
        }
    }
`

export default {
    getGamificationCampaign: GET_GAMIFICATION_CAMPAIGN,
    claimGamificationVoucher: CLAIM_GAMIFICATION_VOUCHER
};
