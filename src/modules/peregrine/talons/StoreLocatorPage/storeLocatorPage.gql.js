/* eslint-disable import/prefer-default-export */
import { gql } from '@apollo/client';

export const getStoreLocationsQuery = gql`
    query storeLocation{
        storeLocation{
            items {
                address
                baseimage
                city
                country_id
                email
                latitude
                link
                longitude
                phone
                state
                store_name
                store_description
                storepickup_id
                zipcode
            }
        }
    }
`;
