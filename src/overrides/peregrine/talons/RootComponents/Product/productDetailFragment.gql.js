import { gql } from '@apollo/client';

const priceRange = `
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
    }
`;

export const ProductDetailsFragment = gql`
    fragment ProductDetailsFragment on ProductInterface {
        __typename
        how_to_use
        more_info {
            label
            value
        }
        categories {
            id
            uid
            name
            level
            breadcrumbs {
                category_id
                category_uid
            }
        }
        description {
            html
        }
        offers {
            id
            rule_code
            name
            description
            image
            promotion_type
        }
        id
        media_gallery_entries {
            id
            label
            position
            disabled
            file
        }
        meta_description
        name
        price {
            regularPrice {
                amount {
                    currency
                    value
                }
            }
        }
        sku
        sale
        promo
        special_price
        discount_percentage
        halal_indicator
        bpom_number
        allergens
        brand_info {
            name
            logo
            category_url
        }
        ${priceRange}
        review {
            reviews_count
            rating_summary
        }
        small_image {
            url
        }
        is_gwp
        stock_status
        stock_item {
          qty
          min_qty
          min_sale_qty
          max_sale_qty
          is_in_stock
        }
        url_key
        ... on ConfigurableProduct {
            configurable_options {
                uid
                attribute_uid
                attribute_id
                attribute_code
                label
                position
                values {
                    uid
                    label
                    default_label
                    store_label
                    value_index
                    swatch_data {
                        __typename
                        value
                        ... on ImageSwatchData {
                            thumbnail
                        }
                    }
                }
            }
            variants {
                attributes {
                    uid
                    code
                    label
                    value_index
                }
                product {
                    uid
                    sku
                    name
                    is_flash_sale
                    special_from_date
                    special_to_date
                    stock_status
                    offers {
                        id
                        rule_code
                        name
                        description
                        image
                        promotion_type
                    }
                    small_image {
                        url
                    }
                    thumbnail {
                        url
                    }
                    stock_item {
                        salable_qty
                        is_in_stock
                    }
                    media_gallery_entries {
                        id
                        label
                        position
                        disabled
                        file
                    }
                    price {
                        regularPrice {
                            amount {
                                currency
                                value
                            }
                        }
                    }
                    price_range {
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
                }
            }
        }
    }
`;


export const ProductDetailCrosssellFragment = gql`
    fragment ProductDetailCrosssellFragment on ProductInterface {
        crosssell_products {
            id
            uid
            offers {
                id
                rule_code
                name
                description
                image
                promotion_type
            }
            name
            special_price
            ${priceRange}
            sku
            small_image {
                url
            }
            stock_status
            type_id
            url_key
            promo
            sale
        }
    }
`
