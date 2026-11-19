import React, { useEffect, useContext, useMemo } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { format } from 'date-fns';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header/index';
import OfflineBgImage from '../components/BgImage/index';
import { getEventMyTickets } from '../offlineEvent.gql';
import compClasses from './index.module.css';
const OfflineTicketList = props => {
    const { showTop = true, showBottom = true } = props;
    const classes = useStyle(compClasses);
    const { setNavConfig } = useContext(HeaderContext);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const history = useHistory();
    const [, { addToast }] = useToasts();

    const { loading: ticketLoading, data: ticketData } = useQuery(
        getEventMyTickets,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);
    const checkAllTruthy = obj => {
        if (typeof obj !== 'object' || obj === null) return false;
        return Object.values(obj).every(item => Boolean(item));
    };
    const goDetail = item => {
        const params = {
            name: item?.attendee?.first_name + ' ' + item?.attendee?.last_name,
            code: item?.ticket_code,
            eventName: item?.event_name,
            location: item?.location,
            date: item?.event_date_time
        };
        if (checkAllTruthy(params)) {
            sessionStorage.setItem(
                'offlineBookingWorkshopDetail',
                JSON.stringify(params)
            );
            history.push('/offline-form-detail?type=detail');
        } else {
            addToast({
                type: 'info',
                message: 'Failed, abnormal data',
                dismissable: true,
                timeout: 3000
            });
        }
    };

    const renderTicketList = useMemo(() => {
        const { myEventTickets: { tickets: ticketList = [] } = {} } =
            ticketData || {};
        if (!ticketList?.length) {
            return (
                <div className={classes.noTicketData}>
                    stay tune for the upcoming event...
                </div>
            );
        }
        return (
            <div className={classes.ticketList}>
                {ticketList?.map((item, index) => {
                    const timeStr = item?.event_date_time
                        ? format(new Date(item.event_date_time), 'yyyy M-d')
                        : '-';
                    return (
                        <div
                            className={classes.itemTicket}
                            key={index}
                            onClick={() => goDetail(item)}
                        >
                            <div className={classes.itemTop}>
                                <div className={classes.leftBox}>
                                    <div className={classes.eventName}>
                                        {item.event_name}
                                    </div>
                                    <div className={classes.eventTime}>
                                        Event Date: {timeStr}
                                    </div>
                                </div>
                                <div className={classes.rightBox}>
                                    <img
                                        className={classes.guardianRun}
                                        src={item.image_url}
                                    />
                                </div>
                            </div>
                            <div className={classes.footCode}>
                                Unique Code:
                                <span className={classes.code}>
                                    {item.ticket_code}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }, [ticketData]);

    return (
        <div className={`${classes.offlineTicketListPage} fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader headerTitle="Event Booking" />
            {/* 背景图 */}
            <OfflineBgImage />
            {/* 内容区域 */}
            <div className={classes.pageWrapper}>
                <div className={classes.ticketListWrapper}>
                    <div className={classes.comTitle}>My Tickets</div>
                    {renderTicketList}
                </div>
            </div>
        </div>
    );
};

export default OfflineTicketList;
