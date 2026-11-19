import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import userActions from '@magento/peregrine/lib/store/actions/user/actions';
import { signOut } from '../actions/user/asyncActions';

const timeouts = new Map();
const intervals = new Map();
const storage = new BrowserPersistence();
const SET_TOKEN = userActions.setToken.toString();
const CLEAR_TOKEN = userActions.clearToken.toString();
const GET_DETAILS = userActions.getDetails.request.toString();

const isSigningIn = type => type === SET_TOKEN || type === GET_DETAILS;
const isSigningOut = type => type === CLEAR_TOKEN;

/**
 * Peregrine schedules signOut + history.go(0) when signin_token has a BrowserPersistence TTL.
 * OAuth sessions omit TTL; scheduling with undefined TTL fires signOut immediately (login reload loop).
 * Never call history.go(0) — use Redux signOut + SPA routing instead.
 */
const scheduleSignOut = store => next => action => {
    const { dispatch } = store;

    if (isSigningIn(action.type)) {
        const item = storage.getRawItem('signin_token');
        if (!item) {
            return next(action);
        }

        let timeStored;
        let ttl;
        let value;
        try {
            ({ timeStored, ttl, value } = JSON.parse(item));
        } catch (e) {
            return next(action);
        }

        // No fixed TTL: session lifetime is managed by OAuth refresh (customerSessionToken).
        if (!ttl) {
            return next(action);
        }

        let parsedValue;
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            return next(action);
        }

        const preciseTTL = ttl * 1000;
        const elapsed = Date.now() - timeStored;
        const expiry = Math.max(preciseTTL - elapsed, 0);

        const callback = () => {
            dispatch(signOut()).then(() => {
                timeouts.delete(parsedValue);
                intervals.delete(parsedValue);
            });
        };

        if (!timeouts.has(parsedValue)) {
            timeouts.set(parsedValue, setTimeout(callback, expiry));
        }

        if (!intervals.has(parsedValue)) {
            intervals.set(
                parsedValue,
                setInterval(() => {
                    const hasExpired = Date.now() - timeStored > preciseTTL;
                    if (hasExpired) {
                        callback();
                    }
                }, 1000)
            );
        }
    } else if (isSigningOut(action.type)) {
        for (const timeoutId of timeouts) {
            clearTimeout(timeoutId);
        }
        for (const intervalId of intervals) {
            clearInterval(intervalId);
        }
        timeouts.clear();
        intervals.clear();
    }

    return next(action);
};

export default scheduleSignOut;
