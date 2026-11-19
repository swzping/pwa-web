import { gql } from '@apollo/client';

const GET_CART_DETAILS = gql`
    query GetCartDetails($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            total_quantity
            items {
                id
                uid
                is_free_gift
                product {
                    uid
                    stock_status
                    is_flash_sale
                    special_to_date
                }
            }
        }
    }
`;

/**
 * Resets the cart's auto-applied voucher state. Must run BEFORE any other
 * cart request so the returned cart data reflects the reset state.
 * The mutation result (e.g. `cart`) is not used here; cart data is always
 * refetched afterwards.
 */
const RESET_AUTO_APPLY_VOUCHER = gql`
    mutation ResetAutoApplyVoucher($cartId: String!) {
        resetAutoApplyVoucher(input: { cart_id: $cartId }) {
            success
        }
    }
`;

export default {
    getCartDetailsQuery: GET_CART_DETAILS,
    resetAutoApplyVoucherMutation: RESET_AUTO_APPLY_VOUCHER
};
