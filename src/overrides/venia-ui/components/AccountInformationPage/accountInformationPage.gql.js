import { gql } from '@apollo/client';
import { AccountInformationPageFragment } from './accountInformationPageFragment.gql';

export const SET_CUSTOMER_INFORMATION = gql`
    mutation SetCustomerInformation(
        $firstname: String
        $lastname: String
        $phonenumber: String
        $whatsapp_number: String
        $password: String
    ) {
        updateCustomerCustom(
            input: {
                firstname: $firstname
                lastname: $lastname
                phonenumber: $phonenumber
                whatsapp_number: $whatsapp_number
                password: $password
            }
        ) {
            customer {
                id
                ...AccountInformationPageFragment
            }
        }
    }
    ${AccountInformationPageFragment}
`;

export const CHANGE_CUSTOMER_PASSWORD = gql`
    mutation ChangeCustomerPassword(
        $currentPassword: String!
        $newPassword: String!
    ) {
        changeCustomerPassword(
            currentPassword: $currentPassword
            newPassword: $newPassword
        ) @connection(key: "changeCustomerPassword") {
            id
            email
        }
    }
`;

export const GET_CUSTOMER_INFORMATION = gql`
    query GetCustomerInformation {
        customer {
            id
            is_register_test
            ...AccountInformationPageFragment
        }
    }
    ${AccountInformationPageFragment}
`;

export const SET_IS_REGISTER_TEST = gql `
    mutation {
            setIsRegisterTest {
            message
        }
    }
`;

export default {
    mutations: {
        setCustomerInformationMutation: SET_CUSTOMER_INFORMATION,
        changeCustomerPasswordMutation: CHANGE_CUSTOMER_PASSWORD,
        setIsRegisterTestMutation: SET_IS_REGISTER_TEST
    },
    queries: {
        getCustomerInformationQuery: GET_CUSTOMER_INFORMATION
    }
};
