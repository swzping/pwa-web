import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getSearchParam } from '@magento/peregrine/lib/hooks/useSearchParam';
import { useUserContext } from '@magento/peregrine/lib/context/user';
// 
/**
 * @typedef {function} useSignInPage
 *
 * @param {String} props.createAccountPageUrl - Create Account Password Page url
 * @param {String} props.forgotPasswordPageUrl - Forgot Password Page url
 * @param {String} props.signedInRedirectUrl - Url to push when user is signed in
 *
 * @returns {{
 *   signInProps: object
 * }}
 */
export const useSignInPage = props => {
    const {
        createAccountPageUrl,
        forgotPasswordPageUrl,
        signedInRedirectUrl
    } = props;
    const location = useLocation();
    const history = useHistory();
    const [{ isSignedIn, isRedirect }] = useUserContext();

    const awRafNumber = useMemo(() => {
        return getSearchParam('awraf', location);
    }, [getSearchParam, location]);

    // Keep location state in memory when pushing history and redirect to
    // the `from` url instead when signing in
    const historyState = useMemo(() => {
        return history && history.location.state ? history.location.state : {};
    }, [history]);
    const fromRedirectUrl = historyState.from || null;


    // Redirect if user is signed in
    useEffect(() => {
        if (isSignedIn) {
            if (fromRedirectUrl || signedInRedirectUrl || isRedirect) {
                if (awRafNumber) {
                    history.push(`/raf/verify?awraf=${awRafNumber}`);
                } else if (fromRedirectUrl || signedInRedirectUrl) {
                    history.push(fromRedirectUrl || signedInRedirectUrl);
                } else {
                    history.push(`${isRedirect}`);
                }
            }
        }
    }, [
        history,
        isSignedIn,
        fromRedirectUrl,
        signedInRedirectUrl,
        awRafNumber,
        isRedirect
    ]);

    const handleShowCreateAccount = useCallback(() => {
        if (createAccountPageUrl) {
            history.push(createAccountPageUrl, historyState);
        }
    }, [createAccountPageUrl, history, historyState]);

    const handleShowForgotPassword = useCallback(() => {
        if (forgotPasswordPageUrl) {
            history.push(forgotPasswordPageUrl, historyState);
        }
    }, [forgotPasswordPageUrl, history, historyState]);

    const signInProps = {
        classes: { modal_active: undefined },
        showCreateAccount: handleShowCreateAccount,
        showForgotPassword: handleShowForgotPassword
    };

    return {
        signInProps
    };
};
