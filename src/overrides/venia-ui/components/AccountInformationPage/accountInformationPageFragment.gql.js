import { gql } from '@apollo/client';
import { WishlistItemFragment } from '@magento/peregrine/lib/talons/WishlistPage//wishlistItemFragments.gql';

export const AccountInformationPageFragment = gql`
    fragment AccountInformationPageFragment on Customer {
        id
        firstname
        lastname
        email
        phonenumber
        whatsapp_number
        wishlists {
            id
            items_count
            sharing_code
            items_v2 {
                items {
                    id
                    ...WishlistItemFragment
                }
            }
        }
    }
    ${WishlistItemFragment}
`;
