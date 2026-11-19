import { gql } from '@apollo/client';

export const getCheckReferralQuery = gql`
    query {
        isReferralInfoGenerated
    }
`;

export const getReferralInfoQuery = gql`
    query {
        getReferralLinkInfo {
            status
            info_rule {
                is_registration_required
                registration_required_text
                advocate_off_text
                friend_off_text
            }
            info_advocate {
                invited_friends_count
                balance_expired
                cumulative_balance
            }
            reward_message
            invite_url
            is_email_subscription
        }
    }
`;

export const generateReferralInfoMutation = gql`
    mutation {
        generateReferralInfo {
            status
            info_rule {
                is_registration_required
                registration_required_text
                advocate_off_text
                friend_off_text
            }
            info_advocate {
                invited_friends_count
                balance_expired
                cumulative_balance
            }
            reward_message
            invite_url
            is_email_subscription
        }
    }
`;
