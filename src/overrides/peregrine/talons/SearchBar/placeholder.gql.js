import { gql } from '@apollo/client';
import { GET_STORE_CONFIG_INFO } from '../../../../modules/peregrine/talons/Header/header.gql';

// TODO: 待删除
// export const getPlaceholderQuery = gql`
//     query {
//         storeConfig {
//             store_code
//             pwa {
//                 placeholder_productsearch
//                 store_code
//             }
//         }
//     }
// `;

export default {
    getPlaceholderQuery: GET_STORE_CONFIG_INFO
};