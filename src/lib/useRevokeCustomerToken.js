import { useMutation } from '@apollo/client';
import { SIGN_OUT as REVOKE_CUSTOMER_TOKEN } from '@magento/peregrine/lib/talons/Header/accountMenu.gql';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';

const storage = new BrowserPersistence();

/**
 * Returns a signOut-compatible revokeToken function for the
 * revokeCustomerToken mutation. The backend revokes the OAuth refresh token
 * family along with the access token, but only when the refresh token rides
 * along under the `X-Revoke-Token-Lr` header. The context object is
 * re-created on every render (the refresh token rotates on refresh); Apollo
 * picks up the latest value at mutate time.
 */
export default function useRevokeCustomerToken() {
    const [revokeCustomerToken] = useMutation(REVOKE_CUSTOMER_TOKEN, {
        context: {
            headers: {
                'X-Revoke-Token-Lr': storage.getItem('refresh_token')
            }
        }
    });

    return revokeCustomerToken;
}
