import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import { clearCartDataFromCache } from '@magento/peregrine/lib/Apollo/clearCartDataFromCache';
import { clearCustomerDataFromCache } from '@magento/peregrine/lib/Apollo/clearCustomerDataFromCache';
import { removeCart } from '@magento/peregrine/lib/store/actions/cart';
import { clearCheckoutDataFromStorage } from '@magento/peregrine/lib/store/actions/checkout';

import { clearOAuthSessionFromStorage } from '../../../../../lib/customerSessionToken';
import actions from './actions';

const storage = new BrowserPersistence();

/**
 * Block Peregrine UserContext auto signOut (empty payload, expired signin_token TTL)
 * after OAuth login wrote a fresh signin_token without BrowserPersistence TTL.
 * Manual logout must pass { explicit: true } or { revokeToken }.
 */
function shouldIgnoreAutoSignOut(payload) {
    const { revokeToken, explicit } = payload;
    if (revokeToken || explicit) {
        return false;
    }
    const raw = storage.getRawItem('signin_token');
    if (!raw) {
        return false;
    }
    try {
        const { ttl } = JSON.parse(raw);
        return !ttl;
    } catch (e) {
        return false;
    }
}

export const signOut = (payload = {}) =>
    async function thunk(dispatch, getState, { apolloClient }) {
        const { revokeToken } = payload;

        if (shouldIgnoreAutoSignOut(payload)) {
            return;
        }

        if (revokeToken) {
            // Send mutation to revoke token.
            try {
                await revokeToken();
            } catch (error) {
                console.error('Error Revoking Token', error);
            }
        }

        if (shouldIgnoreAutoSignOut(payload)) {
            return;
        }

        // Remove token from local storage and Redux.
        await dispatch(clearToken());
        await dispatch(clearMemberId());
        await dispatch(actions.reset());
        await clearCheckoutDataFromStorage();
        await clearCartDataFromCache(apolloClient);
        await clearCustomerDataFromCache(apolloClient);

        // Now that we're signed out, forget the old (customer) cart.
        // We don't need to create a new cart here because we're going to refresh
        // the page immediately after.
        await dispatch(removeCart());
    };

export const getUserDetails = ({ fetchUserDetails }) =>
    async function thunk(...args) {
        const [dispatch, getState] = args;
        const { user } = getState();

        if (user.isSignedIn) {
            dispatch(actions.getDetails.request());

            try {
                const { data } = await fetchUserDetails();

                dispatch(actions.getDetails.receive(data.customer));
            } catch (error) {
                dispatch(actions.getDetails.receive(error));
            }
        }
    };

export const resetPassword = ({ email }) =>
    async function thunk(...args) {
        const [dispatch] = args;

        dispatch(actions.resetPassword.request());

        // TODO: actually make the call to the API.
        // For now, just return a resolved promise.
        await Promise.resolve(email);

        dispatch(actions.resetPassword.receive());
    };

export const setToken = token =>
    async function thunk(...args) {
        const [dispatch] = args;

        // signin_token TTL is managed by the OAuth refresh flow; do not set a fixed TTL here
        // (otherwise BrowserPersistence will silently self-destruct it on getItem).
        storage.removeItem('signin_token');
        storage.setItem('signin_token', token);

        // Persist in store
        dispatch(actions.setToken(token));
    };

export const clearToken = () =>
    async function thunk(...args) {
        const [dispatch] = args;

        // Clear token from local storage
        storage.removeItem('signin_token');
        clearOAuthSessionFromStorage();

        // Remove from store
        dispatch(actions.clearToken());
    };

export const getRedirect = redirect =>
    async function thunk(...args) {
        const [dispatch] = args;

        storage.setItem('signin_redirect', redirect, 3600);

        dispatch(actions.setRedirect(redirect));
    };

export const setMemberId = ({ fetchMemberId }) =>
    async function thunk(...args) {
        const [dispatch] = args;

        const { data } = await fetchMemberId();
        const memberId = data?.customer?.qr_code?.memberId;
        storage.setItem('member_id', memberId);

        dispatch(actions.setMemberId(memberId));
    };

export const clearMemberId = () =>
    async function thunk(dispatch) {
        storage.removeItem('member_id');

        dispatch(actions.clearMemberId());
    };
