import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { useNotification } from '../../../peregrine/talons/Notification/useNotification';
import defaultClasses from './notificationPage.module.css';

const NotificationPage = props => {
    const classes = useStyle(defaultClasses);
    const {
        notificationData,
        notificationLoading,
        notificationError
    } = useNotification();

    const loadingComponent = (
        <div className={classes.loadingWrapper}>
            <div className={classes.loadingContent}>
                <Shimmer key="test-name" width="40%" height='20px' />
                <Shimmer key="test-name" width="80%" height='10px' />
            </div>
            <div className={classes.loadingContent}>
                <Shimmer key="test-name" width="40%" height='20px' />
                <Shimmer key="test-name" width="80%" height='10px' />
            </div>
            <div className={classes.loadingContent}>
                <Shimmer key="test-name" width="40%" height='20px' />
                <Shimmer key="test-name" width="80%" height='10px' />
            </div>
        </div>
    );

    if (notificationLoading) {
        return loadingComponent;
    }

    if (!notificationData || notificationError) {
        return null;
    }

    if (notificationData.customerNotificationList.items.length === 0) {
        return (
            <div className={classes.root}>
                <h1>no notifications</h1>
            </div>
        );
    }

    return (
        <div>
            {notificationData.customerNotificationList.items.map((item, i) => (
                <div key={i} className={classes.root}>
                    <h2>{item.subject}</h2>
                    <p>{item.createdAt}</p>
                </div>
            ))}
        </div>
    );
};

export default NotificationPage;
