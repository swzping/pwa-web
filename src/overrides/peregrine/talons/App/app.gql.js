import { gql } from '@apollo/client';

export const GET_STORE_CONFIG_DATA = gql`
    query getStoreConfigData {
        storeConfig {
            is_maintenance
            store_code
        }
    }
`;

export default {
    getStoreConfigData: GET_STORE_CONFIG_DATA,
};
