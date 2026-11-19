import { gql } from '@apollo/client';
import { GET_STORE_CONFIG_INFO } from '../../../../modules/peregrine/talons/Header/header.gql';

// TODO:
export const GET_STORE_CONFIG_DATA = gql`
    query GetStoreConfigDataForGalleryAC {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        storeConfig {
            store_code
            product_url_suffix
            magento_wishlist_general_is_enabled
            enable_multiple_wishlists
        }
    }
`;

export default {
    getStoreConfigQuery: GET_STORE_CONFIG_INFO
};
