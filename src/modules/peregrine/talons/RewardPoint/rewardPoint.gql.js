import { gql } from '@apollo/client';
import { CartPageFragment } from '@magento/peregrine/lib/talons/CartPage/cartPageFragments.gql';
import { AppliedRewardPointFragment } from './rewardPointFragment.gql';

export const getAppliedRewardPoint = gql`
    query($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AppliedRewardPointFragment
        }
    }
    ${AppliedRewardPointFragment}
`;

export const getRewardPointQuery = gql`
    query {
        customerRewardPoints {
            balance
            balanceCurrency
            formatedBalanceCurrency
            formatedSpendRate
            spendRate
            transaction_history {
                total_count
                page_info {
                    current_page
                    page_size
                    total_pages
                }
                items {
                    balance
                    comment
                    expirationDate
                    points
                    transactionDate
                    transactionId
                }
            }
        }
    }
`;

export const applyRewardPointMutation = gql`
    mutation($cartId: String!, $myPoint: Int!) {
        applyRewardPointsToCart(
            input: { cart_id: $cartId, applied_reward_points: $myPoint }
        ) {
            cart {
                id
                ...CartPageFragment
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;

export const removeRewardPointMutation = gql`
    mutation($cartId: String!) {
        removeRewardPointsFromCart(input: { cart_id: $cartId }) {
            cart {
                id
                ...CartPageFragment
                available_payment_methods {
                    code
                    title
                }
            }
        }
    }
    ${CartPageFragment}
`;
