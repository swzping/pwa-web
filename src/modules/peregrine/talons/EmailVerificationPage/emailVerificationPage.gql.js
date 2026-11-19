import gql from 'graphql-tag';

export const CONFIRM_EMAIL_REGISTRATION_MUTATION = gql`
    mutation confirmEmailRegistration($token: String!) {
        confirmEmailRegistration(
            input: { 
                token: $token 
            }
        ) {
            message
            state
            status
        }
  }
`;

export default {
    confirmEmailRegistrationMutation: CONFIRM_EMAIL_REGISTRATION_MUTATION
};