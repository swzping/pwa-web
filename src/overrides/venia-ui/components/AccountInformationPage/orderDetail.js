import React, { useState, useMemo, useEffect,useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import defaultClasses from './orderDetail.module.css';
import { useQuery, useLazyQuery } from '@apollo/client';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { useWindowSize } from '@magento/peregrine';
import { GET_TRACKING_ORDER } from './graphql/trackingOrderQueries';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { HeaderContext } from '../../../peregrine/context/header';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import {
    ContackGuardian,
    ContactIcon,
    DeliveredDone,
    OnTheRoadDone,
    ReadyDone,
    DeliveredReady,
    OnTheRoadReady,
    ContactIconMobile,
    DeliveredDoneMobile,
    OnTheRoadDoneMobile,
    ReadyDoneMobile,
    DeliveredReadyMobile,
    OnTheRoadReadyMobile,
    LocationIcon,
    ReadyCurrentMobile,
    OnTheRoadCurrentMobile,
    ReadyCurrent,
    OnTheRoadCurrent
} from '@/assets/icons';

const OrderDetail = () => {
    const classes = useStyle(defaultClasses);
    const { orderId } = useParams();
    const history = useHistory();
    const {pathname} = useLocation();
    const location = useLocation();
    const windowSize = useWindowSize();
    const { setNavConfig } = useContext(HeaderContext);
    const [{ currentUser }] = useUserContext();
    const isMobile = windowSize.innerWidth <= 767;

    const userEmail = location.state?.email || currentUser?.email || '';

    const { 
        loading: trackOrderLoading, 
        error: trackOrderError, 
        data: trackOrderData 
    } = useQuery(GET_TRACKING_ORDER, {
        variables: {
            email: userEmail,
            order_id: orderId || ''
        },
        skip: !orderId || !userEmail,
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: false
    });

    const getTimelineIcon = (stage, isCurrent, isDone) => {
        const isActive = isCurrent || isDone
        switch (stage) {
            case 'Item Picked Up':
                return isMobile ? isCurrent ? <ReadyCurrentMobile /> : <ReadyDoneMobile /> : isCurrent ?<ReadyCurrent /> : <ReadyDone />;
            case 'In Transit':
                if (isActive) {
                    return isMobile ? isCurrent ? <OnTheRoadCurrentMobile /> : <OnTheRoadDoneMobile /> : isCurrent ?<OnTheRoadCurrent /> : <OnTheRoadDone />;
                }
                return isMobile ? <OnTheRoadReadyMobile /> : <OnTheRoadReady />;

            case 'Delivered':
                if (isActive) {
                    return isMobile ? <DeliveredDoneMobile /> : <DeliveredDone />
                }
                return isMobile ? <DeliveredReadyMobile /> : <DeliveredReady />;

            default:
                return isMobile ? <ReadyDoneMobile /> : <ReadyDone />;
        }
    };

    const parseOrderData = () => {
        if (!trackOrderData?.ordersFilter?.data?.[0]) {
            return {
                id: orderId ? `#${orderId}` : '',
                requestCode: '',
                recipient: '',
                address: '',
                status: '',
                plName:'',
                trackingEvents: []
            };
        }

        const order = trackOrderData.ordersFilter.data[0];
        const detail = order.detail?.[0];
    
        let recipient = '';
        let address = '';
        let plName = ''
        if (detail?.shipping_address) {
            const addr = detail.shipping_address;
            recipient = `${addr.firstname || ''} ${addr.lastname || ''}`.trim();
            const street = addr.street?.join(', ') || '';
            address = `${street}, ${addr.city || ''}, ${addr.region || ''} ${addr.postcode || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
        }

        if(detail?.shipping_methods?.shipping_description){
            plName = detail?.shipping_methods?.shipping_description
        }

        let currentStatus = '';

        let trackingEvents = [];
        
        if (detail?.shipping_methods?.shipping_detail?.[0]?.data_detail) {
            try {
           
                let dataDetail;
                try {
                    const dataDetailStr = detail.shipping_methods.shipping_detail[0].data_detail.replace(/'/g, '"');
                    dataDetail = JSON.parse(dataDetailStr);
                } catch (jsonError) {
                    try {
                        const dataDetailStr = detail.shipping_methods.shipping_detail[0].data_detail;
                        dataDetail = eval('(' + dataDetailStr + ')');
                    } catch (evalError) {
                        throw evalError;
                    }
                }
                if (dataDetail.content?.history?.[0]) {
                    trackingEvents = dataDetail.content.history.map((item, index) => {
                        
                        const date = new Date(item.timestamp);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                        
                        const event = {
                            type: item.history_message || '', 
                            description: item.message?.id || '',
                            datetime: formattedDate, 
                            location: item.hub_name || '',
                            progress_bar_message: item.progress_bar_message || '' 
                        };
                        return event;
                    });
                } else {
                }
                
             
                
                trackingEvents = [...trackingEvents];
                
                if (trackingEvents.length > 0) {
                    currentStatus = trackingEvents[0].progress_bar_message || '';
                    trackingEvents = trackingEvents.filter(event => event.progress_bar_message === currentStatus);
                }
            } catch (error) {
            }
        } else {
        }

        return {
            id: order.order_number ? `#${order.order_number}` : '',
            requestCode: order.order_number ? `#${order.order_number}` : '',
            recipient,
            plName,
            address,
            status: currentStatus,
            trackingEvents,
        };
    };

    const orderDetail = parseOrderData();

    const stages = ['Item Picked Up', 'In Transit', 'Delivered'];
    
    const currentStatus = orderDetail.currentStatus || orderDetail.status;
    useEffect(() => {
        setNavConfig({
            headerTitle: currentStatus,
            useCart: false,
            showMobileNav: true,
            closeIcon: false,
            borderBottom: true
        });
    }, [pathname,currentStatus]);
    const currentIndex = Math.max(0, stages.findIndex(s => s === currentStatus));
    
    const trackingEvents = orderDetail.trackingEvents || [];
    
    const eventsOrdered = [...trackingEvents];

    if (trackOrderLoading) {
        return (
            <div className={classes.root}>
                <BreadcrumbNavigation orderId={orderId} />
                <div className={classes.contentContainer}>
                    <div className={classes.orderDetailHeader}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <Shimmer width="200px" height="24px" />
                                <Shimmer width="120px" height="16px" style={{ marginLeft: '16px' }} />
                            </div>
                            <Shimmer width="100px" height="24px" />
                        </div>
                        <div className={`${classes.shippingInfoWrapper} d-flex`}>
                            <div className={classes.shippingContent}>
                                <Shimmer width="80px" height="16px" />
                                <Shimmer width="200px" height="14px" style={{ marginTop: '8px' }} />
                            </div>
                            <div className={classes.shippingContent}>
                                <Shimmer width="100px" height="16px" />
                                <Shimmer width="150px" height="14px" style={{ marginTop: '8px' }} />
                            </div>
                            <div className={classes.shippingContent}>
                                <Shimmer width="120px" height="16px" />
                                <Shimmer width="180px" height="14px" style={{ marginTop: '8px' }} />
                            </div>
                        </div>
                    </div>

                    <div className={classes.trackingContainer}>
                        <div className={classes.trackingHeader}>
                            <Shimmer width="150px" height="20px" />
                        </div>
                        <div className={classes.trackingTimeline}>
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className={classes.trackingItem}>
                                    <Shimmer width="24px" height="24px" style={{ borderRadius: '50%' }} />
                                    <div className={classes.trackingContent}>
                                        <Shimmer width="120px" height="16px" />
                                        <Shimmer width="200px" height="14px" style={{ marginTop: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <BreadcrumbNavigation orderId={orderId} />

            <div className={classes.contentContainer}>
                {/* pc page */}
                <div className={classes.desktopOnly}>
                    <div className={classes.topSection}>
                        <div className={classes.shippedToSection}>
                            <div className={classes.sectionTitle}>
                                  <LocationIcon /><span>SHIPPED TO</span> 
                            </div>
                            <div className={classes.recipientName}>{orderDetail.recipient}</div>
                            <div className={classes.address}>{orderDetail.address}</div>
                        </div>

                        <div className={classes.contactSection}>
                            <div className={classes.guardianLogo}>
                                <div className={classes.logoText}>
                                   <ContackGuardian /><span>Guardian</span>
                                </div>
                            </div>
                            <div className={classes.requestCode}>
                                <span>Request Code: {orderDetail.requestCode}</span>
                            </div>
                            <div className={classes.requestCode}>
                                <span>Shipping company: {orderDetail.plName}</span>
                            </div>
                        </div>
                    </div>

                    {/* 配送状态时间线 */}
                    <div className={classes.timelineSection}>
                        <div className={classes.timelineContainer}>
                            {stages.map((stage, index) => {
                                const isCurrent = index === currentIndex;
                                const isDone = index < currentIndex;
                                const iconClass = isCurrent
                                    ? `${classes.timelineIcon} ${classes.active}`
                                    : isDone
                                        ? `${classes.timelineIcon} ${classes.completed}`
                                        : `${classes.timelineIcon} ${classes.pending}`;
                                return (
                                    <React.Fragment key={stage}>
                                        <div className={classes.timelineItem}>
                                            <div className={iconClass}>
                                                {getTimelineIcon(stage, isCurrent, isDone)}
                                            </div>
                                            <div
                                                className={
                                                    isCurrent || isDone
                                                        ? `${classes.timelineText} ${classes.timelineTextActive}`
                                                        : classes.timelineText
                                                }
                                            >
                                                {stage}
                                            </div>
                                        </div>
                                        {index < stages.length - 1 && (
                                            <div className={classes.timelineLineOut}>
                                                <div
                                                    className={
                                                        index < currentIndex
                                                            ? `${classes.timelineLineIn} ${classes.timelineLineInDone}`
                                                            : classes.timelineLineIn
                                                    }
                                                ></div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className={classes.detailsSection}>
                        <div className={classes.eventsList}>
                            {eventsOrdered.map((event, index) => {
                                const isGuardianLocation = currentStatus === 'Item Picked Up' && index === eventsOrdered.length - 1;
                                return (
                                    <div key={index} className={classes.eventItem}>
                                        <div className={`${classes.eventDotGroup} ${index === eventsOrdered.length - 1 ? classes.eventDotGroupWithOutCenter : ''}`}>
                                            {isGuardianLocation ? (
                                              <LocationIcon style={{width: '20px', height: '20px',padding: '3px 5px'}}/>
                                            ) : index === 0 ? (
                                                <div className={`${classes.outerCircle} ${index === 0 ? classes.outerCircleActive : ''}`}>
                                                    <div className={`${classes.innerCircle} ${index === 0 ? classes.innerCircleActive : ''}`}></div>
                                                </div>
                                            ) : (
                                                <div className={`${classes.innerCircleNoSelect}`}></div>
                                            )}
                                            {index === eventsOrdered.length - 1 ? null : (
                                                <div className={classes.eventDotLine}></div>
                                            )}
                                        </div>
                                        <div className={classes.eventContent}>
                                            <div className={classes.eventHeader}>
                                                <span className={classes.eventType}>{event.type}</span>
                                            </div>
                                            <div className={classes.eventDescription}>{event.description}</div>
                                            <div className={classes.eventDescription}>{event.datetime}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 移动端视图 */}
                <div className={classes.mobileOnly}>           
                    <div className={classes.mobileShippedSection}>
                        <div className={classes.mobileSectionTitle}>
                            <LocationIcon /> <span>SHIPPED TO</span>
                        </div>
                        <div className={classes.mobileRecipient}>{orderDetail.recipient}</div>
                        <div className={classes.mobileAddress}>{orderDetail.address}</div>
                    </div>

                    <div className={classes.mobileTimelineSection}>
                        <div className={classes.mobileTimelineContainer}>
                            {stages.map((stage, index) => {
                                const isCurrent = index === currentIndex;
                                const isDone = index < currentIndex;
                                const iconClass = isCurrent
                                    ? `${classes.mobileTimelineIcon} ${classes.active}`
                                    : isDone
                                        ? `${classes.mobileTimelineIcon} ${classes.completed}`
                                        : `${classes.mobileTimelineIcon} ${classes.pending}`;
                                return (
                                    <React.Fragment key={stage}>
                                        <div className={classes.mobileTimelineItem}>
                                            <div className={iconClass}>
                                                {getTimelineIcon(stage, isCurrent, isDone)}
                                            </div>
                                            <div
                                                className={
                                                    isCurrent || isDone
                                                        ? `${classes.mobileTimelineText} ${classes.mobileTimelineTextActive}`
                                                        : classes.mobileTimelineText
                                                }
                                            >
                                                {stage}
                                            </div>
                                        </div>
                                        {index < stages.length - 1 && (
                                            <div className={classes.mobileTimelineLineOut}>
                                                <div
                                                    className={
                                                        index < currentIndex
                                                            ? `${classes.mobileTimelineLineIn} ${classes.mobileTimelineLineInDone}`
                                                            : classes.mobileTimelineLineIn
                                                    }
                                                ></div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className={classes.mobileContactCard}>
                        <div className={classes.mobileContactCardContent}>
                        <div className={classes.mobileContactHeader}>
                                <div className={classes.mobileGuardianLogo}>
                                    <ContactIcon /><span>Guardian</span>
                                </div>
                                <div className={classes.mobileRequestCode}>
                                    Request Code: {orderDetail.requestCode}
                                </div>
                                <div className={classes.mobileRequestCode}>
                                    Shipping company: {orderDetail.plName}
                                </div>
                        </div>
                        </div>
                    </div>

                    {/* mobile side */}
                    <div className={classes.mobileEventsList}>
                        {eventsOrdered.map((event, index) => {
                            const isGuardianLocation = orderDetail.status === 'Item Picked Up' && index === eventsOrdered.length - 1;
                            return (
                                <div key={index} className={classes.mobileEventItem}>
                                    <div className={`${classes.mobileEventDotGroup} ${index === eventsOrdered.length - 1 ? classes.mobileEventDotGroupWithOutCenter : ''}`}>
                                        {isGuardianLocation ? (
                                           <LocationIcon style={{width: '20px', height: '20px',padding: '3px'}}/>
                                        ) : index === 0 ? (
                                            <div className={`${classes.mobileOuterCircle} ${index === 0 ? classes.mobileOuterCircleActive : ''}`}>
                                                <div className={`${classes.mobileInnerCircle} ${index === 0 ? classes.mobileInnerCircleActive : ''}`}></div>
                                            </div>
                                        ) : (
                                            <div className={`${classes.mobileInnerCircleNoSelect}`}></div>
                                        )}
                                        {index === eventsOrdered.length - 1 ? null : (
                                            <div className={classes.mobileEventDotLine}></div>
                                        )}
                                    </div>
                                    <div className={classes.mobileEventContent}>
                                        <div className={classes.mobileEventHeader}>
                                            <span className={classes.mobileEventType}>{event.type}</span>
                                        </div>
                                        <div className={classes.mobileEventDesc}>{event.description}</div>
                                        <div className={classes.mobileEventTime}>{event.datetime}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;