import { gql } from '@apollo/client';

export const GET_BENEFITS_PAGE_CONFIG = gql`
    query getBenefitsPageConfig {
        storeConfig {
            store_code
            cms_membership_benefit_page_identifer
        }
    }
`;

export default {
    getBenefitsPageConfig: GET_BENEFITS_PAGE_CONFIG
};
