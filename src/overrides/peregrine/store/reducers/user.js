import { handleActions } from 'redux-actions';

import { Util } from '@magento/peregrine/lib/index';
const { BrowserPersistence } = Util;

const storage = new BrowserPersistence();

import actions from '@magento/peregrine/lib/store/actions/user';

export const name = 'user';

const isSignedIn = () => !!storage.getItem('signin_token');

const initialState = {
    currentUser: {
        email: '',
        firstname: '',
        lastname: ''
    },
    getDetailsError: null,
    isGettingDetails: false,
    isResettingPassword: false,
    isSignedIn: isSignedIn(),
    isRedirect: '',
    resetPasswordError: null,
    token: storage.getItem('signin_token'),
    memberId: storage.getItem('member_id'),
};

const reducerMap = {
    [actions.setToken]: (state, { payload }) => {
        return {
            ...state,
            isSignedIn: true,
            token: payload
        };
    },
    [actions.clearToken]: state => {
        return {
            ...state,
            isSignedIn: false,
            token: null,
            isRedirect: ''
        };
    },
    [actions.setMemberId]: (state, { payload }) => ({
        ...state,
        memberId: payload
    }),
    [actions.clearMemberId]: state => ({
        ...state,
        memberId: null
    }),
    [actions.getDetails.request]: state => {
        return {
            ...state,
            getDetailsError: null,
            isGettingDetails: true
        };
    },
    [actions.getDetails.receive]: (state, { payload, error }) => {
        if (error) {
            return {
                ...state,
                getDetailsError: payload,
                isGettingDetails: false
            };
        }

        return {
            ...state,
            currentUser: payload,
            getDetailsError: null,
            isGettingDetails: false
        };
    },
    [actions.resetPassword.request]: state => ({
        ...state,
        isResettingPassword: true
    }),
    // TODO: handle the reset password response from the API.
    [actions.resetPassword.receive]: (state, { payload, error }) => {
        if (error) {
            return {
                ...state,
                isResettingPassword: false,
                resetPasswordError: payload
            };
        }

        return {
            ...state,
            isResettingPassword: false,
            resetPasswordError: null
        };
    },
    [actions.reset]: () => {
        return {
            ...initialState,
            isSignedIn: false,
            token: null
        };
    },
    [actions.setRedirect]: (state, { payload }) => {
        return {
            ...state,
            isRedirect: payload
        };
    }
};

export default handleActions(reducerMap, initialState);
