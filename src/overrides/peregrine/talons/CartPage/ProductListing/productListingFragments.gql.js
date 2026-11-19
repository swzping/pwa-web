import { gql } from '@apollo/client';

// export const ProductFragment = gql`
//     fragment ProductFragment on SimpleProduct {
//         id
//         categories {
//             id
//             name
//             level
//         }
//         name
//         sku
//         url_key
//         url_suffix
//         thumbnail {
//             url
//         }
//         small_image {
//             url
//         }
//         stock_status
//     }
// `;

export const ProductFragment = gql`
    fragment ProductFragment on SimpleProduct {
        id
        uid
        thumbnail {
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
    }
`;
export const ProductListingFragment = gql`
    fragment ProductListingFragment on Cart {
        id
        total_quantity
        tiering_nudge {
            voucher_code
            voucher_name
            action_type
            message
            is_applied
            is_best_tier
            current_tier {
                min_spend
                discount_value
                discount_label
                estimated_saving
            }
            next_tier {
                min_spend
                discount_value
                discount_label
                estimated_saving
                amount_needed
            }
        }
        prices {
            grand_total {
                currency
                value
                __typename
            }
        }
        items {
            id
            uid
            validOffers {
                id
                rule_code
                name
                description
                image
                promotion_type
            }
            product {
                uid
                name
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
                url_key
                url_suffix
                promo
                small_image {
                    url
                }
                crosssell_products {
                    ...ProductFragment
                    price_range {
                        minimum_price {
                            regular_price {
                                currency
                                value
                            }
                        }
                    }
                }
                ...ProductFragment
                ${
                    /* 
                    ... on SimpleProduct {
                        crosssell_products {
                            ...ProductFragment
                            price_range {
                                minimum_price {
                                    regular_price {
                                        currency
                                        value
                                    }
                                }
                            }
                        }
                    }
                */ ''
                }
                ... on ConfigurableProduct {
                    variants {
                        attributes {
                            uid
                        }
                        product {
                            id
                            uid
                            small_image {
                                url
                            }
                        }
                    }
                }
                ... on CustomizableProductInterface {
                    options {
                        __typename
                        uid
                        required
                        sort_order
                        title
                        ... on CustomizableDropDownOption {
                            uid
                            required
                            sort_order
                            title
                            __typename
                            value {
                                uid
                                price
                                sku
                                title
                                sort_order
                                option_type_id
                            }
                        }
                        ... on CustomizableCheckboxOption {
                            uid
                            required
                            sort_order
                            title
                            __typename
                            value {
                                uid
                                price
                                sku
                                title
                                sort_order
                                option_type_id
                            }
                        }
                        ... on CustomizableRadioOption {
                            uid
                            required
                            sort_order
                            title
                            __typename
                            value {
                                uid
                                price
                                sku
                                title
                                sort_order
                                option_type_id
                            }
                        }
                        ... on CustomizableMultipleOption {
                            required
                            sort_order
                            title
                            __typename
                            value {
                                uid
                                price
                                sku
                                title
                                sort_order
                                option_type_id
                            }
                        }
                    }
                }
            }
            custom_price {
                row_total {
                  currency
                  value
                  __typename
                }
                __typename
            }
            custom_cart_discount {
                promo_id
                discount_amount
            }
            is_free_gift
            is_gamification_free_gift
            free_gift_data {
                sku
                name
                url_key
                qty
                price {
                    currency
                    value
                }
                image_url
            }
            quantity
                ... on ConfigurableCartItem {
                    configurable_options {
                        id
                        configurable_product_option_value_uid
                        option_label
                        value_id
                        value_label
                    }
                    configured_variant {
                        is_flash_sale
                        special_from_date
                        special_to_date
                        uid
                        sku
                        name
                        stock_status
                        small_image {
                            url
                        }
                        stock_item {
                            salable_qty
                            is_in_stock
                        }
                    }
                }
            ... on SimpleCartItem {
                customizable_options {
                    customizable_option_uid
                    is_required
                    sort_order
                    label
                    values {
                        customizable_option_value_uid
                        value
                        label
                    }
                }
            }
            ... on BundleCartItem {
                bundle_options {
                  label
                  values {
                    label
                    price
                  }
                }
            }
            ... on SimpleCartItem {
                customizable_options {
                    customizable_option_uid
                    is_required
                    sort_order
                    label
                    values {
                        customizable_option_value_uid
                        value
                        label
                    }
                }
            }
            ... on BundleCartItem {
                bundle_options {
                  label
                  values {
                    label
                    price
                  }
                }
            }
        }
    }
    ${ProductFragment}
`;
