import { gql } from '@apollo/client';

export const CategoryFragment = gql`
    fragment CategoryFragment on CategoryTree {
        id
        uid
        meta_title
        meta_keywords
        meta_description
        image
    }
`;

export const ProductsFragment = gql`
    fragment ProductsFragment on Products {
        items {
            id
            uid
            categories {
                id
                uid
                name
                level
            }
            name
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
                    regular_price {
                        currency
                        value
                    }
                    final_price {
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
            }
            type_id
            url_key
            url_suffix
            variant_parent_sku
            variant_parent_url
            variant_parent_url_key
            variant_parent_url_suffix
            variant_preselected_options
            sale
            promo
            discount_percentage
        }
        page_info {
            total_pages
            current_page
            page_size
        }
        total_count
    }
`;
