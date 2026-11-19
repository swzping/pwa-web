import { gql } from '@apollo/client';

export { GetVesMenu as OSMOS_GET_VES_MENU } from '../modules/peregrine/talons/VesMenu/vesMenu.gql';

export const OSMOS_GET_PRODUCT_BY_SKU = gql`
    query osmosGetProductBySku($sku: String!) {
        products(filter: { sku: { eq: $sku } }, pageSize: 1) {
            items {
                url_key
                sku
            }
        }
    }
`;

export const OSMOS_GET_BRAND_LIST = gql`
    query osmosGetBrandList {
        getBrandList {
            items {
                attribute_id
                category_url
                name
            }
        }
    }
`;

/** 与 MegaMenu categoryList 一致，按当前 store 返回 url_path / url_key */
export const OSMOS_GET_CATEGORY_BY_ID = gql`
    query osmosGetCategoryById($id: String!) {
        categoryList(filters: { ids: { eq: $id } }) {
            uid
            url_path
            url_key
        }
    }
`;

export const OSMOS_GET_CATEGORY_BY_UID = gql`
    query osmosGetCategoryByUid($uid: String!) {
        categories(filters: { category_uid: { in: [$uid] } }) {
            items {
                uid
                url_path
                url_key
            }
        }
    }
`;

export const OSMOS_GET_STORE_SUFFIX = gql`
    query osmosGetStoreSuffix {
        storeConfig {
            category_url_suffix
            product_url_suffix
        }
    }
`;
