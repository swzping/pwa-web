import { gql } from '@apollo/client';

export const GET_NOTIFITION_LIST = gql`query(
  $notificationType: String,
  $pageSize: Int, 
  $currentPage: Int, 
  $notificationSortCode: String,
  $notificationSortDirection: SortEnum
) {
  getNotifications(
    notification_type: $notificationType,
    pageSize: $pageSize,
    currentPage: $currentPage,
    sort: { code: $notificationSortCode, direction: $notificationSortDirection }
  ) {
    total_count
    currentPage
    total_pages
    has_unread
    sort_by {
      code
      direction
    }
    notifications {
      publish_id
      notification_id
      template_name
      category_type
      target_type
      title
      start_date
      end_date
      description
      icon
      redirect_url
      is_read
      read_at
      priority
      created_at
    }
  }
}
`;

export const GET_NOTIFITION_CATEGORY = gql`
    query GetNotificationCategory {
        getNotificationCategory {
            code
            label
        }
    }
`;

export const VIEW_NOTIFITION = gql`
query($publishId: Int!) {
  viewNotification(publish_id: $publishId) {
    redirect_url
    category_type
    redirection_type
    description
    start_date
    end_date
    image
    icon
    title
  }
}
`

export const GET_NOTIFITION_COUNT = gql`
query countUnreadNotifications {
    getNotifications {
        total_unread
        __typename
    }
}
`