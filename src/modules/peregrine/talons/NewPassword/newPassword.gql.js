import gql from 'graphql-tag';

export const GET_RESET_PASSWORD_TOKEN_QUERY = gql`
    query checkResetPasswordToken($token: String!) {
        checkLrForpassTokenExist(token: $token) {
            firstname
            lastname
            lr_forpass_token
        }
    }
`;

export const SET_NEW_PASSWORD_MUTATION = gql`
    mutation setNewPassword($newPasswordInput: SetNewPasswordInput!) {
        setNewPassword(input: $newPasswordInput) {
            info
        }
    }
`;
const CHANGE_PASSWORD_MUTATION = gql`
    mutation ChangePassword(
        $currentPassword: String!,
        $newPassword: String!
    ) {
        changeCustomerPasswordLr(
            currentPassword: $currentPassword,
            newPassword: $newPassword,
        ) {
            id
            customer_email
        }
    }
`

export default {
    queries: {
        getResetPasswordTokenQuery: GET_RESET_PASSWORD_TOKEN_QUERY
    },
    mutations: {
        setNewPasswordMutation: SET_NEW_PASSWORD_MUTATION,
        changePasswordMutation: CHANGE_PASSWORD_MUTATION
    }
};
