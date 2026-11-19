import { setContext } from '@apollo/client/link/context';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import userActions from '@magento/peregrine/lib/store/actions/user/actions';
import store from '../store';

const storage = new BrowserPersistence();

/** GraphQL document (keep in sync with signIn.gql REFRESH_ACCESS_TOKEN) */
const REFRESH_ACCESS_TOKEN_QUERY = `
mutation RefreshAccessToken($refresh_token: String!) {
  refreshCustomerAccessToken(refresh_token: $refresh_token) {
    status
    message
    access_token
    refresh_token
    expires_in
    customer_token {
      token
    }
  }
}
`;

let refreshInFlight = null;
let proactiveRefreshTimer = null;
let proactiveRefreshStarted = false;
let proactiveRefreshApiBase = null;

/** Network failures only: 1 initial attempt + this many retries. */
const REFRESH_NETWORK_MAX_RETRIES = 3;
const REFRESH_NETWORK_RETRY_DELAY_MS = 1000;

/**
 * Start calling refresh when access token expires within this window.
 * Example: 5 min + 1h token → refresh begins ~55 min after login/last refresh.
 */
export const OAUTH_REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Normalize API `expires_in` to absolute expiry time in ms.
 * Supports: OAuth duration (seconds), Unix seconds, epoch ms, ISO/date string.
 */
export function normalizeExpiresInToExpiryAtMs(expires_in) {
    if (expires_in == null || expires_in === '') {
        return null;
    }
    const n = Number(expires_in);
    if (!Number.isFinite(n)) {
        const t = Date.parse(String(expires_in));
        return Number.isNaN(t) ? null : t;
    }
    if (n > 1e12) {
        return n;
    }
    if (n > 1e9) {
        return n * 1000;
    }
    return Date.now() + n * 1000;
}

/**
 * Persisted expiry must end *after* the proactive refresh window, otherwise
 * `shouldRefreshOAuthAccess` stays true and every GraphQL triggers another refresh.
 */
export function resolveOAuthAccessExpiryAtMs(expires_in) {
    let expMs = normalizeExpiresInToExpiryAtMs(expires_in);
    if (expMs == null) {
        return null;
    }

    const now = Date.now();
    const minRemainingMs = OAUTH_REFRESH_BEFORE_EXPIRY_MS + 60 * 1000;

    if (expMs - now <= minRemainingMs) {
        const n = Number(expires_in);
        if (Number.isFinite(n) && n > 0 && n < 1e9) {
            expMs = now + n * 1000;
        }
        if (expMs - now <= minRemainingMs) {
            expMs = now + minRemainingMs;
        }
    }

    return expMs;
}

export function getOAuthAccessExpiryAtMs() {
    const raw = storage.getItem('access_token_expires_in');
    if (raw == null || raw === '') {
        return null;
    }
    if (typeof raw === 'number') {
        return raw;
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n > 1e12) {
        return n;
    }
    const parsed = Date.parse(String(raw));
    return Number.isNaN(parsed) ? null : parsed;
}

export function shouldRefreshOAuthAccess(
    bufferMs = OAUTH_REFRESH_BEFORE_EXPIRY_MS
) {
    const expMs = getOAuthAccessExpiryAtMs();
    if (expMs == null) {
        return false;
    }
    if (!storage.getItem('refresh_token')) {
        return false;
    }
    return Date.now() + bufferMs >= expMs;
}

export function persistOAuthBundle({
    access_token,
    refresh_token,
    expires_in,
    customer_token
}) {
    if (access_token) {
        storage.setItem('access_token', access_token);
    }
    if (refresh_token) {
        storage.setItem('refresh_token', refresh_token);
    }
    // Always overwrite or remove previous expiry so stale data from a
    // prior session never tricks shouldRefreshOAuthAccess into an
    // immediate refresh loop right after login.
    const expMs = resolveOAuthAccessExpiryAtMs(expires_in);
    if (expMs != null) {
        storage.setItem('access_token_expires_in', new Date(expMs).toISOString());
    }

    if (customer_token != null) {
        storage.setItem('customer_token', customer_token);
    }
    const magentoToken = customer_token && customer_token.token;
    if (magentoToken) {
        const existingToken = storage.getItem('signin_token');
        storage.setItem('signin_token', magentoToken);
        if (magentoToken !== existingToken) {
            store.dispatch(userActions.setToken(magentoToken));
        }
    }

    if (proactiveRefreshStarted && proactiveRefreshApiBase && expMs != null) {
        scheduleNextProactiveRefresh(proactiveRefreshApiBase);
    }
}

export function clearOAuthSessionFromStorage() {
    storage.removeItem('access_token');
    storage.removeItem('refresh_token');
    storage.removeItem('access_token_expires_in');
    storage.removeItem('customer_token');
    if (proactiveRefreshTimer) {
        clearTimeout(proactiveRefreshTimer);
        proactiveRefreshTimer = null;
    }
}

function isRetryableRefreshNetworkError(error) {
    if (!error) {
        return false;
    }
    if (error.retryable === true) {
        return true;
    }
    if (error instanceof TypeError) {
        return true;
    }
    const msg = String(error.message || '').toLowerCase();
    return (
        msg.includes('network error') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('network request failed')
    );
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function postGraphQL(apiBase, body, headers) {
    let res;
    try {
        res = await fetch(apiBase, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...headers
            },
            body: JSON.stringify(body),
            credentials: 'include'
        });
    } catch (e) {
        const err = new Error(e.message || 'Network error');
        err.retryable = true;
        throw err;
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const retryable =
            res.status >= 500 || res.status === 408 || res.status === 429;
        const err = new Error(
            json?.errors?.[0]?.message || res.statusText || 'Network error'
        );
        err.retryable = retryable;
        throw err;
    }
    if (json.errors && json.errors.length) {
        const err = new Error(json.errors[0].message);
        err.retryable = false;
        throw err;
    }
    return json.data;
}

/**
 * Refresh LoginRadius / customer OAuth session via standalone fetch (not Apollo),
 * then persist tokens and Magento customer `signin_token` when `customer_token` is returned.
 */
export async function refreshOAuthSessionViaFetch(apiBase) {
    const refresh_token = storage.getItem('refresh_token');
    if (!refresh_token) {
        return { ok: false, reason: 'no_refresh_token' };
    }
    const storeCode =
        storage.getItem('store_view_code') ||
        (typeof STORE_VIEW_CODE !== 'undefined' ? STORE_VIEW_CODE : 'default');

    let lastNetworkError = null;

    for (let attempt = 0; attempt <= REFRESH_NETWORK_MAX_RETRIES; attempt++) {
        try {
            const data = await postGraphQL(
                apiBase,
                {
                    query: REFRESH_ACCESS_TOKEN_QUERY,
                    variables: { refresh_token }
                },
                { store: storeCode }
            );

            const payload = data?.refreshCustomerAccessToken;
            if (!payload) {
                return { ok: false, reason: 'empty_response' };
            }

            if (!payload.status) {
                return {
                    ok: false,
                    reason: 'api_status',
                    message: payload.message
                };
            }

            persistOAuthBundle({
                access_token: payload.access_token,
                refresh_token: payload.refresh_token,
                expires_in: payload.expires_in,
                customer_token: payload.customer_token
            });

            return { ok: true, payload };
        } catch (e) {
            if (!isRetryableRefreshNetworkError(e)) {
                return { ok: false, reason: 'error', message: e.message };
            }

            lastNetworkError = e;
            if (attempt < REFRESH_NETWORK_MAX_RETRIES) {
                await delay(REFRESH_NETWORK_RETRY_DELAY_MS);
                continue;
            }
        }
    }

    return {
        ok: false,
        reason: 'error',
        message: lastNetworkError?.message || 'Network error',
        attempts: REFRESH_NETWORK_MAX_RETRIES + 1
    };
}

/**
 * Schedule the next idle refresh check at (expiry - buffer). No API until that time.
 */
function scheduleNextProactiveRefresh(apiBase) {
    if (typeof window === 'undefined' || !apiBase) {
        return;
    }

    if (proactiveRefreshTimer) {
        clearTimeout(proactiveRefreshTimer);
        proactiveRefreshTimer = null;
    }

    if (!storage.getItem('refresh_token')) {
        return;
    }

    const expMs = getOAuthAccessExpiryAtMs();
    if (expMs == null) {
        return;
    }

    const triggerAt = expMs - OAUTH_REFRESH_BEFORE_EXPIRY_MS;
    const delay = Math.max(triggerAt - Date.now(), 0);

    proactiveRefreshTimer = setTimeout(
        () => runProactiveRefreshTick(apiBase),
        delay
    );
}

async function runProactiveRefreshTick(apiBase) {
    if (shouldRefreshOAuthAccess()) {
        const result = await ensureOAuthAccessFresh(apiBase);
        // Failed: no proactive setTimeout(0) loop. Retry via next GraphQL or tab visible.
        if (!result?.ok) {
            return;
        }
        // Skipped because another tab already refreshed: persistOAuthBundle
        // did not run in this tab, so re-arm the timer from the new expiry.
        scheduleNextProactiveRefresh(apiBase);
        return;
    }
    scheduleNextProactiveRefresh(apiBase);
}

const REFRESH_LOCK_NAME = 'oauth-refresh-token';

/**
 * All tabs share one refresh_token in localStorage and the backend rotates it,
 * so only one tab may refresh at a time. Web Locks serialize across tabs.
 */
function withCrossTabRefreshLock(task) {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
        return navigator.locks.request(REFRESH_LOCK_NAME, task);
    }
    return Promise.resolve().then(task);
}

export function ensureOAuthAccessFresh(apiBase) {
    const refresh_token = storage.getItem('refresh_token');
    if (!refresh_token) {
        return Promise.resolve({ ok: true, skipped: true });
    }
    if (!shouldRefreshOAuthAccess()) {
        return Promise.resolve({ ok: true, skipped: true });
    }
    if (refreshInFlight) {
        return refreshInFlight;
    }

    refreshInFlight = withCrossTabRefreshLock(() => {
        // Another tab may have refreshed while this one waited for the lock.
        if (!shouldRefreshOAuthAccess()) {
            return { ok: true, skipped: true };
        }
        return refreshOAuthSessionViaFetch(apiBase);
    })
        .then(result => {
            if (result.ok && shouldRefreshOAuthAccess()) {
                console.warn(
                    '[OAuth] access_token_expires_in still inside refresh window after refresh; check API expires_in'
                );
            }
            return result;
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
}

/** Force refresh token */
export function forceRefreshToken () {
    // Force refresh token, Modify expiration time
    storage.setItem('access_token_expires_in', Date.now())
}

/**
 * Idle-tab scheduler: `setTimeout` until (expiry - 5min). Not a fixed-interval API poll.
 */
export function startProactiveRefresh(apiBase) {
    if (proactiveRefreshStarted) return;
    if (typeof window === 'undefined') return;
    if (!apiBase) return;
    proactiveRefreshStarted = true;
    proactiveRefreshApiBase = apiBase;

    scheduleNextProactiveRefresh(apiBase);

    window.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            runProactiveRefreshTick(apiBase);
        }
    });
}

/**
 * Replaces default Peregrine auth link: before each operation, refresh OAuth session when near expiry,
 * then attach `Authorization: Bearer <signin_token>` (Magento customer token).
 */
export function createMagentoAuthLinkWithRefresh(apiBase) {
    return setContext(async (_, prev) => {
        const headers = prev.headers || {};
        await ensureOAuthAccessFresh(apiBase);
        const token = storage.getItem('signin_token');
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : ''
            }
        };
    });
}
