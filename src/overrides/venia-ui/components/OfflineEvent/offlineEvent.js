import React, {
    useMemo,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useLocation, useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Image from '@magento/venia-ui/lib/components/Image';
import { useWindowSize } from '@magento/peregrine';
import { useQuery } from '@apollo/client';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import OfflineHeader from './components/Header/index';
import OfflineBgImage from './components/BgImage/index';
import OfflineBgCardImage from './components/BgCardImage';
import { EventIcon } from '@/assets/icons';
import { format } from 'date-fns';
import { getEventBookingList, getEventMyTickets } from './offlineEvent.gql';
import defaultClasses from './offlineEvent.module.css';

const OFFLINE_EVENT_NO_DATA = 'stay tune for the upcoming event...';
const OfflineEventPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { setNavConfig } = useContext(HeaderContext);
    const location = useLocation();
    const history = useHistory();
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const { loading: listLoading, data: listData } = useQuery(
        getEventBookingList,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );

    const { loading: ticketLoading, data: ticketData } = useQuery(
        getEventMyTickets,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );
    const { myEventTickets: { tickets: ticketList = [] } = {} } =
        ticketData || {};

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    const renderTicketList = useMemo(() => {
        if (!ticketList?.length) {
            return (
                <div className={classes.noTicketData}>
                    {OFFLINE_EVENT_NO_DATA}
                </div>
            );
        }
        return (
            <div className={classes.ticketList}>
                {ticketList?.slice(0, 3)?.map((item, index) => {
                    const timeStr = item?.event_date_time
                        ? format(new Date(item.event_date_time), 'yyyy M-d')
                        : '-';
                    return (
                        <div className={classes.itemTicket} key={index}>
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
    const renderCardList = useMemo(() => {
        const { eventBookingList: { events: eventList = [] } = {} } =
            listData || {};

        if (!eventList?.length) {
            return (
                <div
                    className={`${classes.noTicketData}`}
                    style={{ marginTop: '83px' }}
                >
                    {OFFLINE_EVENT_NO_DATA}
                </div>
            );
        }
        return (
            <div className={classes.cardList}>
                {eventList?.map((item, index) => {
                    return (
                        <div
                            key={index}
                            className={classes.itemCardWrapper}
                            onClick={() => goToActivityDetail(item)}
                        >
                            <div className={classes.itemCard}>
                                <img
                                    className={classes.guardianCard}
                                    src={item.tile_banner_url}
                                />
                            </div>
                            <div className={classes.itemName}>{item.name}</div>
                        </div>
                    );
                })}
            </div>
        );
    }, [listData]);

    const handleMore = () => {
        history.push('/offline-ticket-list');
    };

    const goToActivityDetail = item => {
        history.push(`/offline-activity-detail?eventId=${item?.id || ''}`);
    };

    return (
        <div className={`${classes.offlineEventPage} fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader headerTitle="Event Booking" />
            {/* 背景图 */}
            <OfflineBgImage />
            <div className={classes.pageWrapper}>
                {/* 头部卡片 */}
                <div className={classes.ticketWrapper}>
                    <div className={classes.ticketTop}>
                        <div className={classes.comTitle}>My Tickets</div>
                        {!!ticketList?.length && (
                            <div
                                className={classes.viewMore}
                                onClick={handleMore}
                            >
                                View More
                            </div>
                        )}
                    </div>
                    <div className={classes.ticketContent}>
                        {renderTicketList}
                    </div>
                </div>
                {/* 活动卡片 */}
                <div className={classes.contentWrapper}>
                    {isMobile ? (
                        <>
                            <div className={classes.comTitle}>
                                Upcoming Event
                            </div>
                            <EventIcon className={classes.eventIcon} />
                        </>
                    ) : (
                        <div className={classes.cardHeadTag}>
                            Upcoming Event
                            <img
                                style={{ marginLeft: 4 }}
                                width={160}
                                height={3}
                                src="/venia-static-assets/images/milestone_Rectangle.png"
                                alt="milestone_Rectangle"
                            />
                        </div>
                    )}
                    {/* 活动列表 */}
                    <div className={classes.cardListWrapper}>
                        {renderCardList}
                    </div>
                    <OfflineBgCardImage showGuardian={isMobile ? true : false} />
                </div>
            </div>
        </div>
    );
};
export default OfflineEventPage;
