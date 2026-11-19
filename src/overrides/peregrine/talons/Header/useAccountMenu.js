import { useState, useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/Header/accountMenu.gql';

import useRevokeCustomerToken from '@/lib/useRevokeCustomerToken';
import { removeCookies } from '../../../../modules/peregrine/util/cookies';
import COMPARE_OPERATIONS from '../../../../modules/peregrine/talons/Compare/compare.gql';

/**
 * The useAccountMenu talon complements the AccountMenu component.
 *
 * @param {Object} props
 * @param {DocumentNode} props.operations.signOutMutation - Mutation to be called for signout.
 * @param {Boolean} props.accountMenuIsOpen - Boolean to notify if the account menu dropdown is open.
 * @param {Function} props.setAccountMenuIsOpen - Function to set the value of accountMenuIsOpen
 *
 * @returns {Object}    talonProps
 * @returns {String}    talonProps.view - Current view.
 * @returns {String}  talonProps.username - Username of the current user trying to login / logged in.
 * @returns {Boolean}   talonProps.isUserSignedIn - Boolean to notify if the user is signed in.
 * @returns {Function}  talonProps.handleSignOut - Function to handle the signout workflow.
 * @returns {Function}  talonProps.handleForgotPassword - Function to handle forgot password workflow.
 * @returns {Function}  talonProps.handleCreateAccount - Function to handle create account workflow.
 * @returns {Function}  talonProps.setUsername - Function to set the username.
 */

export const useAccountMenu = props => {
    const { accountMenuIsOpen, setAccountMenuIsOpen } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, COMPARE_OPERATIONS, props.operations);
    const { getLocalCompareListProductsQuery } = operations;

    const [view, setView] = useState('SIGNIN');
    const [username, setUsername] = useState('');

    const history = useHistory();
    const location = useLocation();
    const revokeToken = useRevokeCustomerToken();
    const { client: localClient } = useQuery(getLocalCompareListProductsQuery);
    const [{ isSignedIn: isUserSignedIn }, { signOut }] = useUserContext();

    const handleSignOut = useCallback(async () => {
        setView('SIGNIN');
        setAccountMenuIsOpen(false);

        // clear cache comparelist product
        await removeCookies('uid_compare')
        await localClient.writeQuery({
            query: getLocalCompareListProductsQuery,
            data: { localCompareListProducts: [] },
        });

        // Delete cart/user data from the redux store.
        await signOut({ revokeToken });

        // SPA redirect after signOut; do not use history.go(0) (full page reload).
        if (
            location.pathname !== '/sign-in' &&
            !location.pathname.startsWith('/sign-in/')
        ) {
            history.replace('/sign-in');
        }
    }, [history, location.pathname, revokeToken, setAccountMenuIsOpen, signOut]);

    const handleForgotPassword = useCallback(() => {
        setView('FORGOT_PASSWORD');
    }, []);

    const handleCancel = useCallback(() => {
        setView('SIGNIN');
    }, []);

    const handleCreateAccount = useCallback(() => {
        setView('CREATE_ACCOUNT');
    }, []);

    const handleAccountCreation = useCallback(() => {
        setView('ACCOUNT');
    }, []);

    // Close the Account Menu on page change.
    // This includes even when the page "changes" to the current page.
    // This can happen when clicking on a link to a page you're already on, for example.
    useEffect(() => {
        setAccountMenuIsOpen(false);
    }, [location, setAccountMenuIsOpen]);

    // Update view based on user status everytime accountMenuIsOpen has changed.
    useEffect(() => {
        if (isUserSignedIn) {
            setView('ACCOUNT');
        } else {
            setView('SIGNIN');
        }
    }, [accountMenuIsOpen, isUserSignedIn]);

    return {
        handleAccountCreation,
        handleCreateAccount,
        handleForgotPassword,
        handleCancel,
        handleSignOut,
        updateUsername: setUsername,
        username,
        view
    };
};
