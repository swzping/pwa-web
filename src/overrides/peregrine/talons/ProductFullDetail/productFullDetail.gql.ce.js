import { gql } from '@apollo/client';

import { CartTriggerFragment } from '@magento/peregrine/lib/talons/Header/cartTriggerFragments.gql';
import { MiniCartFragment } from '@magento/peregrine/lib/talons/MiniCart/miniCartFragments.gql';

export const ADD_PRODUCT_TO_CART = gql`
    mutation AddProductToCart($cartId: String!, $product: CartItemInput!) {
        addProductsToCart(cartId: $cartId, cartItems: [$product]) {
            user_errors {
                code
                message
            }
            toastr_message {
                status
                message
            }
        }
    }
`;

export const GET_WISHLIST_CONFIG = gql`
    query GetWishlistConfigForProductCE {
        storeConfig {
            id
            magento_wishlist_general_is_enabled
            store_code
        }
    }
`;

/**
 * @deprecated - replaced by general mutation in @magento/peregrine/lib/talons/productFullDetail.js
 */
export const ADD_CONFIGURABLE_MUTATION = gql`
    mutation addConfigurableProductToCart(
        $cartId: String!
        $quantity: Float!
        $sku: String!
        $parentSku: String!
    ) {
        addConfigurableProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [
                    {
                        data: { quantity: $quantity, sku: $sku }
                        parent_sku: $parentSku
                    }
                ]
            }
        ) @connection(key: "addConfigurableProductsToCart") {
            cart {
                id
                # Update the cart trigger when adding an item.
                ...CartTriggerFragment
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${CartTriggerFragment}
    ${MiniCartFragment}
`;

/**
 * @deprecated - replaced by general mutation in @magento/peregrine/lib/talons/productFullDetail.js
 */
export const ADD_SIMPLE_MUTATION = gql`
    mutation addSimpleProductToCart(
        $cartId: String!
        $quantity: Float!
        $sku: String!
    ) {
        addSimpleProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
            }
        ) @connection(key: "addSimpleProductsToCart") {
            cart {
                id
                # Update the cart trigger when adding an item.
                ...CartTriggerFragment
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${CartTriggerFragment}
    ${MiniCartFragment}
`;

export const ADD_DOWNLOADABLE_PRODUCT = gql`
    mutation addDownloadableProductsToCart(
        $cartId: String!
        $quantity: Float!
        $sku: String!
    ) {
        addDownloadableProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
            }
        ) @connection(key: "addDownloadableProductsToCart") {
            cart {
                id
                # Update the cart trigger when adding an item.
                ...CartTriggerFragment
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${CartTriggerFragment}
    ${MiniCartFragment}
`;

/**
 * @deprecated - replaced by general mutation in @magento/peregrine/lib/talons/productFullDetail.js
 */
export const ADD_VIRTUAL_MUTATION = gql`
    mutation addVirtualProductToCart(
        $cartId: String!
        $quantity: Float!
        $sku: String!
    ) {
        addVirtualProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
            }
        ) @connection(key: "addVirtualProductsToCart") {
            cart {
                id
                # Update the cart trigger when adding an item.
                ...CartTriggerFragment
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${CartTriggerFragment}
    ${MiniCartFragment}
`;

export const ADD_BUNDLE_TO_CART = gql`
    mutation(
        $cartId: String!
        $data: CartItemInput!
        $bundleOptions: [BundleOptionInput]!
    ) {
        addBundleProductsToCart(
            input: {
                cart_id: $cartId
                cart_items: { data: $data, bundle_options: $bundleOptions }
            }
        ) @connection(key: "addBundleProductsToCart") {
            cart {
                id
                # Update the cart trigger when adding an item.
                ...CartTriggerFragment
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${CartTriggerFragment}
    ${MiniCartFragment}
`;

export const getEmailCustomer = gql`
    query {
        customer {
            email
        }
    }
`;

export default {
    addConfigurableProductToCartMutation: ADD_CONFIGURABLE_MUTATION,
    addProductToCartMutation: ADD_PRODUCT_TO_CART,
    addSimpleProductToCartMutation: ADD_SIMPLE_MUTATION,
    addDownloadableProductToCartMutation: ADD_DOWNLOADABLE_PRODUCT,
    addVirtualProductToCartMutation: ADD_VIRTUAL_MUTATION,
    getWishlistConfigQuery: GET_WISHLIST_CONFIG,
    addBundleProductToCartMutation: ADD_BUNDLE_TO_CART,
    getEmailCustomer
};
