import { gql } from '@apollo/client';

export const contactFormMutation = gql`
    mutation contactusFormSubmit(
        $email: String!
        $fullname: String!
        $message: String!
        $telephone: String
    ) {
        contactusFormSubmit(
            input: {
                email: $email
                fullname: $fullname
                message: $message
                telephone: $telephone
            }
        ) {
            success_message
        }
    }
`;
