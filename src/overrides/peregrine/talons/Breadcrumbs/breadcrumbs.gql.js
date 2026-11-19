import { gql } from '@apollo/client';
import { GET_CATEGORY_CONTENT } from '@magento/peregrine/lib/talons/RootComponents/Category/categoryContent.gql';

export const GET_STORE_CONFIG_DATA = gql`
    query GetStoreConfigForBreadcrumbs {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        storeConfig {
            store_code
            category_url_suffix
        }
    }
`;

export default {
    getBreadcrumbsQuery: GET_CATEGORY_CONTENT,
    getStoreConfigQuery: GET_STORE_CONFIG_DATA
};
