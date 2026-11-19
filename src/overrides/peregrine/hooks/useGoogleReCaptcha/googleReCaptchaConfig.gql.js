import { gql } from '@apollo/client';

export const GET_RECAPTCHAV3_CONFIG = gql`
    query RecaptchaV3Config {
        recaptchaV3Config {
            badge_position
            failure_message
            forms
            language_code
            minimum_score
            website_key
        }
    }
`;

export default {
    getReCaptchaV3ConfigQuery: GET_RECAPTCHAV3_CONFIG
};
