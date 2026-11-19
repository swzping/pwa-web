import { gql } from '@apollo/client';
import { PriceSummaryFragment, PriceSummaryFragmentCart } from '@magento/peregrine/lib/talons/CartPage/PriceSummary/priceSummaryFragments.gql';

const GET_PRICE_SUMMARY = gql`
    query Summary($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            applied_reward_points{
                is_use_reward_points
                reward_points
                reward_points_amount
            }
            applied_store_credit{
                is_use_store_credit
                store_credit_amount
            }
            ...PriceSummaryFragment
        }
    }
    ${PriceSummaryFragment}
`;

const GET_PRICE_SUMMARY_CART = gql`
    query getPriceSummaryCheckout($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            applied_reward_points{
                is_use_reward_points
                reward_points
                reward_points_amount
            }
            applied_store_credit{
                is_use_store_credit
                store_credit_amount
            }
            ...PriceSummaryFragmentCart
        }
    }
    ${PriceSummaryFragmentCart}
`;

export default {
    getPriceSummaryQuery: GET_PRICE_SUMMARY,
    getPriceSummaryQueryCart: GET_PRICE_SUMMARY_CART
};
