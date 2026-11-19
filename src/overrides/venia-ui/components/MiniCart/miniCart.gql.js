import { gql } from '@apollo/client';
import { MiniCartFragment } from '@magento/peregrine/lib/talons/MiniCart/miniCartFragments.gql';

/**
 * @deprecated - Moved to @magento/peregrine/lib/talons/MiniCart/miniCartFragments.gql
 */
export { MiniCartFragment };

// 合并后的请求
export const MINI_CART_ALL_QUERY = gql`
    query MiniCartAllQuery($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            total_quantity
            email
            items {
                id
                uid
                quantity
                ... on ConfigurableCartItem {
                    configurable_options {
                        id
                        configurable_product_option_value_uid
                        value_id
                        value_label
                    }
                }
                custom_cart_discount {
                    promo_id
                    discount_amount
                    __typename
                }
                is_free_gift
                custom_price {
                    row_total {
                        currency
                        value
                        __typename
                    }
                    __typename
                }
                prices {
                    price {
                        currency
                        value
                        __typename
                    }
                    total_item_discount {
                        value
                        __typename
                    }
                    __typename
                }
                product {
                    id
                    uid
                    name
                    sku
                    is_flash_sale
                    special_price
                    special_from_date
                    special_to_date
                    url_key
                    url_suffix
                    thumbnail {
                        url
                        __typename
                    }
                    small_image {
                        url
                        __typename
                    }
                    stock_status
                    promo
                    stock_item {
                        qty
                        min_qty
                        min_sale_qty
                        max_sale_qty
                        is_in_stock
                        salable_qty
                        backorders
                        qty_increments
                        manage_stock
                        __typename
                    }
                    __typename
                }
                __typename
            }
            prices {
                subtotal_with_discount_excluding_tax {
                    value
                    currency
                    __typename
                }
                subtotal_excluding_tax {
                    currency
                    value
                    __typename
                }
                subtotal_including_tax {
                    currency
                    value
                    __typename
                }
                discounts {
                    amount {
                        currency
                        value
                        __typename
                    }
                    label
                    __typename
                }
                grand_total {
                    currency
                    value
                    __typename
                }
                __typename
            }
            shipping_addresses {
                selected_shipping_method {
                    amount {
                        currency
                        value
                        __typename
                    }
                    __typename
                }
                street
                __typename
            }
            __typename
        }
    }
`;

// TODO: 待删除
export const MINI_CART_QUERY = gql`
    query MiniCartQueryPrice($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            total_quantity
            ...MiniCartFragment
        }
    }
    ${MiniCartFragment}
`;

// TODO: 待删除
export const MINI_CART_QUERY_DISCOUNT = gql`
    query MiniCartQuery($cartId: String!) {
        cart(cart_id: $cartId) {
            id
        }
    }
`;

// TODO: 待删除
export const MINI_CART_QUERY_ITEMS = gql`
    query MiniCartQueryItems($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            email
            applied_coupons {
                code
                discount_amount
                is_free_gift_coupon
                is_cashback_coupon
                rule_name
                cashback_amount
            }
            items {
                id
                uid
                custom_cart_discount {
                    promo_id
                    discount_amount
                }
                is_free_gift
                custom_price {
                    row_total {
                        currency
                        value
                        __typename
                    }
                    __typename
                }
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
                    promo
                    stock_item {
                        salable_qty
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
    }
`;

export const REMOVE_ITEM_MUTATION = gql`
    mutation RemoveItemForMiniCart($cartId: String!, $itemId: Int!) {
        removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $itemId })
            @connection(key: "removeItemFromCart") {
            cart {
                id
                items {
                    id
                    uid
                    custom_cart_discount {
                        promo_id
                        discount_amount
                    }
                    is_free_gift
                    custom_price {
                        row_total {
                            currency
                            value
                            __typename
                        }
                        __typename
                    }
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
                        promo
                        stock_item {
                            salable_qty
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
        }
    }
`;

export default {
    miniCartQuery: MINI_CART_ALL_QUERY,
    removeItemMutation: REMOVE_ITEM_MUTATION,
    miniCartQueryItems: MINI_CART_ALL_QUERY, // TODO: remove
    miniCartQueryDiscount: MINI_CART_ALL_QUERY // TODO: remove
};
