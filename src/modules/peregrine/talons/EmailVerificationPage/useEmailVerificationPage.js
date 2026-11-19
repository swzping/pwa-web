import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import { useUserContext } from '@magento/peregrine/lib/context/user';
import { getSearchParam } from '@magento/peregrine/lib/hooks/useSearchParam';

import DEFAULT_OPERATIONS from './emailVerificationPage.gql';

/**
 * @typedef {function} useEmailVerificationPage
 *
 * @param {String} props.signedInRedirectUrl - Url to push when user is signed in
 * @param {String} props.signInPageUrl - Sign In Page url
 *
 * @returns {{
 *   errors: Array,
 *   hasValidToken: boolean,
 *   isConfirmationCompleted: boolean,
 *   timeoutToSignIn: number,
 * }}
 */

const TIMEOUT_TO_REDIRECT = 5;

export const useEmailVerificationPage = props => {
    const { signedInRedirectUrl, signInPageUrl } = props;
    const history = useHistory();
    const location = useLocation();

    const [{ isSignedIn }] = useUserContext();

    const [timeoutToSignIn, setTimeoutToSignIn] = useState(TIMEOUT_TO_REDIRECT);

    const [
        confirmEmailRegistration,
        { called, data, error, loading }
    ] = useMutation(DEFAULT_OPERATIONS.confirmEmailRegistrationMutation);

    const token = useMemo(() => {
        return getSearchParam('vtoken', location);
    }, [getSearchParam, location]);

    const hasValidToken = useMemo(() => {
        return token && data && data.confirmEmailRegistration;
    }, [token, data]);

    const isConfirmationCompleted = !loading || (data && data.confirmEmailRegistration);

    // Redirect if user is signed in
    useEffect(() => {
        if (isSignedIn && signedInRedirectUrl) {
            history.push(signedInRedirectUrl);
        }
    }, [history, isSignedIn, signedInRedirectUrl]);

    useEffect(async () => {
        if(!called && token) {
            try {                
                await confirmEmailRegistration({
                    variables: { token }
                });
            } catch (error) {}
        }
    }, [token]);

    useEffect(() => {
        let runningTimer;

        if (data && data.confirmEmailRegistration) {
            runningTimer = setInterval(() => {
                setTimeoutToSignIn(timeoutToSignIn-1);
            }, 1000);

            if(timeoutToSignIn == 0) {
                history.push(signInPageUrl);
            }
        }

        return () => clearInterval(runningTimer);
    }, [data, timeoutToSignIn]);

    return {
        errors: [error],
        hasValidToken,
        isConfirmationCompleted,
        timeoutToSignIn
    };
};