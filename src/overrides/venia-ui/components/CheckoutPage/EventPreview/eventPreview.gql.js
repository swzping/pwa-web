import { gql } from '@apollo/client';

// 获取 checkout 页活动预览浮层的活动 id(与 App 端
// dfi_event_booking_checkout_guardian_run_event_id 配置一致)
export const GET_EVENT_RUN_ID = gql`
    query GetEventRunIdForCheckout {
        storeConfig {
            store_code
            dfi_event_booking_checkout_guardian_run_event_id
        }
    }
`;

// 获取活动票种余量(仅浮层所需字段,与 App 端 EVENT_BOOKING_DETAIL 对应)
export const GET_EVENT_BOOKING_DETAIL = gql`
    query GetEventBookingDetailForCheckout($eventId: ID!) {
        eventBookingDetail(event_id: $eventId) {
            categories {
                code
                label
                remaining_quota
            }
        }
    }
`;
