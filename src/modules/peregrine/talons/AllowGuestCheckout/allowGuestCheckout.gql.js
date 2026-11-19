import { gql } from '@apollo/client';
import { GET_STORE_CONFIG_INFO } from '../Header/header.gql'

// TODO:
// export const getAllowGuestCheckout = gql`
//     query {
//         storeConfig {
//             allow_guest_checkout
//             store_code
//             temporary_customer_group_allow_checkout
//         }
//     }
// `;

export default {
    getAllowGuestCheckout: GET_STORE_CONFIG_INFO,
};


