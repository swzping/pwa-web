import { gql } from '@apollo/client';

export const ItemsReviewFragment = gql`
    fragment ItemsReviewFragment on Cart {
        id
        total_quantity
        items {
            id
            uid
            product {
                id
                uid
                price_range {
                    maximum_price {
                        final_price {
                            currency
                            value
                        }
                    }
                }
                categories {
                    id
                    uid
                    name
                    level
                }
                name
                sku
                ... on ConfigurableProduct {
                    variants {
                        attributes {
                            uid
                        }
                        product {
                            id
                            uid
                            thumbnail {
                                url
                            }
                        }
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
            custom_price {
                row_total {
                    currency
                    value
                }
            }
            quantity
            ... on ConfigurableCartItem {
                configurable_options {
                    id
                    option_label
                    value_id
                    value_label
                }
                configured_variant {
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
            custom_cart_discount {
                promo_id
                discount_amount
            }
            is_free_gift
        }
    }
`;
