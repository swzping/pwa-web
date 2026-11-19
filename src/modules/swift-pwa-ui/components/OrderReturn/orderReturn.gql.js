import { gql } from '@apollo/client';

export const GET_RETURN_OPTIONS = gql`
    query GetReturnOptions {
        dfiReturnOptions {
            solutions { code label reasons { uid label requires_text } }
            media {
                enabled min_files max_files max_video_files max_image_files video_required
                max_video_mb max_image_mb video_extensions image_extensions
            }
        }
    }
`;

export const REQUEST_RETURN = gql`
    mutation RequestOrderReturn($input: RequestReturnInput!) {
        requestReturn(input: $input) {
            return { uid number display_status }
        }
    }
`;

export const GET_RETURN_DETAIL = gql`
    query GetCustomerReturnDetail($uid: ID!) {
        customer {
            return(uid: $uid) {
                uid number display_status
                dfi_item_total { value currency }
                solution { code label }
                reason { label }
                reason_other_text
                items { uid request_quantity order_item {
                    product_name product_sku refundable_unit_price { value currency }
                    product { uid thumbnail { url label } }
                } }
                comments { text created_at }
                attachments { url type file_name }
            }
        }
    }
`;
