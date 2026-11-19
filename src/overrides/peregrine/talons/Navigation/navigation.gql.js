import { gql } from '@apollo/client';
import { GET_STORE_CONFIG_INFO } from '../../../../modules/peregrine/talons/Header/header.gql';

export const GET_CUSTOMER = gql`
    query GetCustomerForLeftNav {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        customer {
            email
            firstname
            lastname
            is_subscribed
        }
    }
`;

// TODO: 待删除
const GET_ROOT_CATEGORY_ID = gql`
    query getRootCategoryId {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        storeConfig {
            store_code
            root_category_uid
        }
    }
`;

export default {
    getCustomerQuery: GET_CUSTOMER,
    getRootCategoryId: GET_STORE_CONFIG_INFO
};
