import { gql } from '@apollo/client';
import { ProductDetailsFragment } from '@magento/peregrine/lib/talons/RootComponents/Product/productDetailFragment.gql.js';

export const getStoreConfig = gql`
    query GetStoreConfigData {
        storeConfig {
            id
            category_url_suffix
            store_code
        }
    }
`;

export const getBrandsQuery = gql`
    query getBrands {
        getBrandList {
            page_size
            featured {
                attribute_id
                logo
                name
                sort_order
                is_active
                category_url
            }
            items {
                attribute_id
                logo
                name
                sort_order
                is_active
                category_url
            }
        }
    }
`;

export const getBrandDetailsQuery = gql`
    query getBrandDetails($urlKey: String) {
        categories(filters: { ids: { eq: $urlKey } }) {
            items {
                id
                uid
                name
                image
                description
                image_path
            }
        }
    }
`;

export const getBrandProductQuery = gql`
    query getBrandProducts($filters: FilterEqualTypeInput!) {
        products(filter: { category_id: $filters }) {
            items {
                id
                name
                price_range {
                    maximum_price {
                        regular_price {
                            currency
                            value
                        }
                        discount {
                            amount_off
                            percent_off
                        }
                    }
                }
                sale
                sku
                special_price
                price {
                    regularPrice {
                        amount {
                            currency
                            value
                        }
                    }
                }
                small_image {
                    url
                }
                stock_status
                type_id
                url_key
            }
        }
    }
`;
