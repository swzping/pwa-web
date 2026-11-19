import { createActions } from 'redux-actions';

const prefix = 'USER';
const actionTypes = ['RESET', 'SET_TOKEN', 'CLEAR_TOKEN', 'SET_REDIRECT', 'SET_MEMBER_ID', 'CLEAR_MEMBER_ID'];

const actionMap = {
    SIGN_IN: {
        REQUEST: null,
        RECEIVE: null,
    },
    GET_DETAILS: {
        REQUEST: null,
        RECEIVE: null,
    },
    CREATE_ACCOUNT: {
        REQUEST: null,
        RECEIVE: null,
    },
    RESET_PASSWORD: {
        REQUEST: null,
        RECEIVE: null,
    },
};

export default createActions(actionMap, ...actionTypes, { prefix });
