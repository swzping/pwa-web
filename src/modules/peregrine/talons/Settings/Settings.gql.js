import { gql } from '@apollo/client';

export const GET_CUSTOMER_SETTING = gql`
{
    customer {
        firstname
        lastname
        email
        is_subscribed
    }
}
`;

export const UPDATE_CUSTOMER = gql`
    mutation updateCustomerSetting($isSubscribed: Boolean!) {
        updateCustomer(
            input: {
              is_subscribed: $isSubscribed
            }
          ) {
            customer {
                is_subscribed
            }
          }
    }
`;
