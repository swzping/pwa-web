import { useQuery } from '@apollo/client';
import { customerNotificationList } from './notification.gql';
import { useUserContext } from '@magento/peregrine/lib/context/user';

export const useNotification = props => {
    const [{ isSignedIn }] = useUserContext();

    const {
        data: notificationData,
        loading: notificationLoading,
        error: notificationError
    } = useQuery(customerNotificationList, {
        fetchPolicy: 'network-only',
        skip: !isSignedIn
    });

    return {
        notificationData,
        notificationLoading,
        notificationError
    };
};
