import { gql } from '@apollo/client';
import { MiniCartFragment } from '@magento/peregrine/lib/talons/MiniCart/miniCartFragments.gql';
import { CartPageFragment } from '@magento/peregrine/lib/talons/CartPage/cartPageFragments.gql.js';
import { AvailableShippingMethodsCartFragment } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/ShippingMethods/shippingMethodsFragments.gql.js';
import { ProductListingFragment } from '@magento/peregrine/lib/talons/CartPage/ProductListing/productListingFragments.gql';

const ADD_ITEM = gql`
    mutation AddItemToCart($cartId: String!, $cartItem: CartItemInput!) {
        addProductsToCart(cartId: $cartId, cartItems: [$cartItem]) {
            cart {
                id
                ...MiniCartFragment
            }
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
    ${MiniCartFragment}
`;

export const ADD_DOWNLOADABLE_ITEM = gql`
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
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${MiniCartFragment}
`;

export const ADD_VIRTUAL_ITEM = gql`
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
                # Update the mini cart when adding an item.
                ...MiniCartFragment
            }
        }
    }
    ${MiniCartFragment}
`;

export const REMOVE_ITEM = gql`
    mutation removeItem($cartId: String!, $itemId: ID!) {
        removeItemFromCart(
            input: { cart_id: $cartId, cart_item_uid: $itemId }
        ) {
            cart {
                id
                ...CartPageFragment
                ...AvailableShippingMethodsCartFragment
            }
        }
    }
    ${CartPageFragment}
    ${AvailableShippingMethodsCartFragment}
`;

export const UPDATE_ITEM = gql`
    mutation updateItemQuantity(
        $cartId: String!
        $itemId: Int!
        $quantity: Float!
    ) {
        updateCartItems(
            input: {
                cart_id: $cartId
                cart_items: [{ cart_item_id: $itemId, quantity: $quantity }]
            }
        ) @connection(key: "updateCartItems") {
            cart {
                id
                ...ProductListingFragment
                ...MiniCartFragment
            }
            user_errors {
                message
                code
            }
        }
    }
    ${ProductListingFragment}
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
    ADD_ITEM,
    ADD_DOWNLOADABLE_ITEM,
    ADD_VIRTUAL_ITEM,
    REMOVE_ITEM,
    UPDATE_ITEM,
    getEmailCustomer
};
