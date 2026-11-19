import { gql } from '@apollo/client';

// TODO: 待删除
export const GET_STORE_CONFIG_DATA = gql`
    query getStoreConfigData {
        storeConfig {
            header_logo_src
            store_code
        }
    }
`;

export const GET_STORE_CONFIG_INFO = gql`
    query GetStoreConfig {
        storeConfig {
            id
            store_code
            locale
            allow_guest_checkout
            temporary_customer_group_allow_checkout
            product_url_suffix
            category_url_suffix
            header_logo_src
            root_category_uid
            magento_wishlist_general_is_enabled
            enable_multiple_wishlists
            configurable_thumbnail_source
            dfi_event_booking_enabled
            dfi_event_booking_category_selection_timeout
            free_shipping_threshold
            pwa {
                placeholder_productsearch
                store_code
            }
        }
    }
`

export default {
    getStoreConfigData: GET_STORE_CONFIG_INFO,
};
