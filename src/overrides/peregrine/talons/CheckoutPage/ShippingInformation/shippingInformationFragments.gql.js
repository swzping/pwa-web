import { gql } from '@apollo/client';

export const ShippingInformationFragment = gql`
    fragment ShippingInformationFragment on Cart {
        id
        email
        dest_location {
            dest_latitude
            dest_longitude
        }
        shipping_addresses {
            city
            country {
                code
                label
            }
            firstname
            lastname
            latitude
            longitude
            postcode
            region {
                code
                label
                region_id
            }
            street
            telephone
        }
    }
`;
