import { gql } from '@apollo/client';

import { ProductDetailsFragment, ProductDetailCrosssellFragment } from './productDetailFragment.gql';

export const GET_STORE_CONFIG_DATA = gql`
    query getStoreConfigData {
        # eslint-disable-next-line @graphql-eslint/require-id-when-available
        storeConfig {
            store_code
            product_url_suffix
        }
    }
`;

export const GET_PRODUCT_DETAIL_QUERY = gql`
    query getProductDetailForProductPage($urlKey: String!) {
        products(filter: { url_key: { eq: $urlKey } }) {
            items {
                id
                uid
                type_id
                is_flash_sale
                special_price
                special_from_date
                special_to_date
                ...ProductDetailsFragment
            }
        }
    }
    ${ProductDetailsFragment}
`;

export const GET_PRODUCT_DETAIL_CROSSSELL_QUERY = gql`
    query getCrossellFromProduct($urlKey: String!) {
        products(filter: { url_key: { eq: $urlKey } }) {
            items {
                id
                uid
                type_id
                url_key
                ...ProductDetailCrosssellFragment
            }
        }
    }
    ${ProductDetailCrosssellFragment}
`;

export default {
    getStoreConfigData: GET_STORE_CONFIG_DATA,
    getProductDetailQuery: GET_PRODUCT_DETAIL_QUERY,
    getProductDetailCrosssellQuery: GET_PRODUCT_DETAIL_CROSSSELL_QUERY
};
