import { onError } from '@apollo/client/link/error';
import getWithPath from 'lodash.get';
import setWithPath from 'lodash.set';
import { signOut } from '@magento/peregrine/lib/store/actions/user';
import { recoverCart } from '@magento/peregrine/lib/store/actions/cart/asyncActions';
import store from '@/store';

// Matches the same invalid-cart errors that the cart asyncActions fallback
// (isInvalidCart) treats as "the current cartId is dead and must be replaced":
// - "Could not find a cart ...": the quote no longer exists (expired and
//   cron-cleaned, environment/DB mismatch).
// - "The cart isn't active": the quote exists but is deactivated (order
//   placed on it, merged into the customer cart on sign-in).
// - "The current user cannot perform operations on cart": the cartId belongs
//   to a different customer session (expired/cleared auth token).
const INVALID_CART_MESSAGES = [
    'Could not find a cart',
    "The cart isn't active",
    'The current user cannot perform operations on cart'
];
const isInvalidCartMessage = message =>
    INVALID_CART_MESSAGES.some(m => message.includes(m));

export default function createErrorLink() {
    return onError(handler => {
        const { graphQLErrors, networkError, operation, response } = handler;

        if (graphQLErrors) {
            graphQLErrors.forEach(({ message, locations, path }) => {
                const layoutMsgList = ['Customer does not exist.']
                if(layoutMsgList.includes(message)) {
                    store.dispatch(signOut({ explicit: true }));
                }
                console.log(
                    `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                )
            });

            const failingCartId =
                (operation &&
                    operation.variables &&
                    operation.variables.cartId) ||
                null;
            const { cartId: currentCartId } = store.getState().cart;

            // Skip the createEmptyCart recovery mutation itself (no recursion)
            // and skip cartIds that a recovery has already replaced (in-flight
            // echo of an already-healed cart). Equal or missing ids trigger a
            // heal - deduped by the recoverCart in-flight guard.
            const isRecoveryMutation =
                operation && operation.operationName === 'createCart';
            const isStaleCartId =
                failingCartId && currentCartId && failingCartId !== currentCartId;

            if (
                typeof window !== 'undefined' &&
                !isRecoveryMutation &&
                !isStaleCartId &&
                graphQLErrors.some(({ message }) => isInvalidCartMessage(message))
            ) {
                store.dispatch(recoverCart());
            }
        }

        if (networkError && networkError.message.includes('Response not successful: Received status code 401')) {
            // 401 时从 response body 中提取具体 GraphQL errors
            const result = networkError.result;
            if (result && result.errors && Array.isArray(result.errors)) {
                // 注入到 response.errors 中
                if (response) {
                    response.errors = result.errors;
                }

                // 将 body errors 合并到 networkError.graphQLErrors 中，
                // 这样下游 catch 到的 error.graphQLErrors 就能读取到具体错误信息
                if (!networkError.graphQLErrors) {
                    networkError.graphQLErrors = [];
                }
                result.errors.forEach(bodyErr => {
                    networkError.graphQLErrors.push({
                        message: bodyErr.message,
                        locations: bodyErr.locations || [],
                        path: bodyErr.path || [],
                        extensions: bodyErr.extensions || {}
                    });
                });

                // 将顶层 message 替换为第一个 body error 的消息
                if (result.errors[0] && result.errors[0].message) {
                    networkError.message = result.errors[0].message;
                }

                result.errors.forEach(({ message }) => {
                    const layoutMsgList = ['Customer does not exist.'];
                    if (layoutMsgList.includes(message)) {
                        store.dispatch(signOut({ explicit: true }));
                    }
                    console.log(`[GraphQL error from 401 body]: ${message}`);
                });
            } else {
                console.log(`[Network error]: ${networkError}`);
            }
        } else if (networkError) {
            console.log(`[Network error]: ${networkError}`);
        }

        if (response) {
            const { data, errors } = response;

            // If there are no errors in response, skip the rest
            if (!errors || !errors.length) return;

            let pathToCartItems;

            // It's within the GraphQL spec to receive data and errors, where
            // errors are merely informational and not intended to block. Almost
            // all existing components were not built with this in mind, so we
            // build special handling of this error message so we can deal with
            // it at the time we deem appropriate.
            errors.forEach(({ message, path }, index) => {
                if (
                    message === 'Some of the products are out of stock.' ||
                    message ===
                        'There are no source items with the in stock status' ||
                    message === 'The requested qty is not available'
                ) {
                    if (!pathToCartItems) {
                        pathToCartItems = path.slice(0, -1);
                    }

                    // Set the error to null to be cleaned up later
                    response.errors[index] = null;
                }
            });

            // indicator that we have some cleanup to perform on the response
            if (pathToCartItems) {
                const cartItems = getWithPath(data, pathToCartItems);
                const filteredCartItems = cartItems.filter(
                    cartItem => cartItem !== null
                );
                setWithPath(data, pathToCartItems, filteredCartItems);

                const filteredErrors = response.errors.filter(
                    error => error !== null
                );
                // If all errors were stock related and set to null, reset the error response so it doesn't throw
                response.errors = filteredErrors.length
                    ? filteredErrors
                    : undefined;
            }
        }
    });
}
