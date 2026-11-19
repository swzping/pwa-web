import { gql } from '@apollo/client';

export const GET_PAGE_SIZE = gql`
    query getPageSize {
        storeConfig {
            id
            grid_per_page
            store_code
        }
    }
`;

export const GET_PRODUCT_FILTERS_BY_SEARCH = gql`
    query getProductFiltersBySearch($search: String!) {
        products(search: $search) {
            aggregations {
                label
                count
                attribute_code
                options {
                    label
                    value
                    count
                }
            }
        }
    }
`;

export const PRODUCT_SEARCH = gql`
    query ProductSearch(
        $currentPage: Int = 1
        $inputText: String!
        $pageSize: Int = 6
        $filters: ProductAttributeFilterInput!
        $sort: ProductAttributeSortInput
    ) {
        products(
            currentPage: $currentPage
            pageSize: $pageSize
            search: $inputText
            filter: $filters
            sort: $sort
        ) {
            items {
                id
                uid
                __typename
                name
                offers {
                    id
                    rule_code
                    name
                    description
                    image
                    promotion_type
                }
                is_flash_sale
                special_price
                special_from_date
                special_to_date
                price_range {
                    minimum_price {
                        discount {
                            amount_off
                            percent_off
                        }
                        final_price {
                            currency
                            value
                        }
                        regular_price {
                            currency
                            value
                        }
                    }
                    maximum_price {
                        final_price {
                            currency
                            value
                        }
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
                stock_item {
                    qty
                    min_qty
                    min_sale_qty
                    max_sale_qty
                    backorders
                    qty_increments
                    manage_stock
                    is_in_stock
                    salable_qty
                }
                type_id
                url_key
                url_suffix
                sale
                promo
                variant_parent_sku
                variant_parent_url
                variant_parent_url_key
                variant_parent_url_suffix
                variant_preselected_options
                discount_percentage
            }
            page_info {
                total_pages
                current_page
            }
            total_count
        }
    }
`;

// TODO: delete
export const GET_FILTER_INPUTS = gql`
    query GetFilterInputsForSearch {
        __type(name: "ProductAttributeFilterInput") {
            inputFields {
                name
                type {
                    name
                }
            }
        }
    }
`;

export default {
    getFilterInputsQuery: GET_FILTER_INPUTS,
    getPageSize: GET_PAGE_SIZE,
    getProductFiltersBySearchQuery: GET_PRODUCT_FILTERS_BY_SEARCH,
    productSearchQuery: PRODUCT_SEARCH
};
