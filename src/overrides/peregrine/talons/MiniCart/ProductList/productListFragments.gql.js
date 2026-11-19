import { gql } from '@apollo/client';

export const ProductListFragment = gql`
    fragment ProductListFragment on Cart {
        id
        items {
            id
            uid
            product {
                id
                uid
                name
                sku
                url_key
                url_suffix
                thumbnail {
                    url
                }
                stock_status
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
            prices {
                price {
                    currency
                    value
                }
            }
            quantity
            ... on BundleCartItem {
                bundle_options {
                    label
                    values {
                        label
                        price
                    }
                }
            }
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
        }
    }
`;
