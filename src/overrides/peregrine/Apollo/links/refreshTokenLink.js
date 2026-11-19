import { setContext } from '@apollo/client/link/context';

import {
    ensureOAuthAccessFresh,
    startProactiveRefresh
} from '../../../../lib/customerSessionToken';

/**
 * Runs before the auth link: refreshes OAuth access when near expiry so
 * `signin_token` in storage is up to date before Authorization is attached.
 *
 * Also starts a one-time proactive refresh scheduler so the session keeps
 * being renewed while the user is idle (no GraphQL traffic).
 *
 * @param {string} apiBase GraphQL HTTP endpoint (same `uri` as Apollo httpLink).
 */
export default function createRefreshTokenLink(apiBase) {
    startProactiveRefresh(apiBase);

    return setContext(async () => {
        if (apiBase) {
            await ensureOAuthAccessFresh(apiBase);
        }
        return {};
    });
}
