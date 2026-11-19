import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { Copy } from 'react-feather';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header';
import OfflineBgImage from '../components/BgImage';
import RegisterSuccessCard from '../components/RegisterSuccessCard';
import OfflineBgCardImage from '../components/BgCardImage';
import compClasses from './activityFormDetail.module.css';

const ActivityFormDetailPage = () => {
    const urlParams = new URLSearchParams(location.search);
    const viewType = urlParams.get('type');
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const classes = useStyle(compClasses);
    const { setNavConfig } = useContext(HeaderContext);
    const history = useHistory();
    const [copiedText, setCopiedText] = useState(null);
    const [cacheData, setCacheData] = useState({});

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    useEffect(() => {
        try {
            const params = sessionStorage.getItem(
                'offlineBookingWorkshopDetail'
            );
            if (params) {
                const parseData = JSON.parse(params);
                setCacheData(parseData);
            }
        } catch (error) {
            console.log('sessionStorage backup:', error);
        }
    }, []);

    const handleCopy = async val => {
        if (!val) return;
        navigator.clipboard
            .writeText(val)
            .then(() => {
                setCopiedText(val);
                setTimeout(() => setCopiedText(null), 1000);
            })
            .catch(err => console.log('coopon code error: ', err));
    };

    const ticketInfo = useMemo(() => {
        const { ticket = {} } = cacheData || {};
        const formatTime = cacheData.date
            ? format(new Date(cacheData.date), 'd MMMM yyyy HH:mm')
            : '-';
        return {
            title: cacheData?.title,
            subTitle: cacheData?.subTitle,
            name: cacheData?.name,
            code: cacheData?.code,
            eventName: cacheData?.eventName,
            location: cacheData?.location,
            date: formatTime
        };
    }, [cacheData]);

    return (
        <div className={`${classes.root} fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader
                headerTitle={isMobile ? 'Event Booking' : ''}
                isShowHeader={isMobile ? true : false}
            />
            {/* 背景栏 */}
            <OfflineBgImage />
            {/* 内容区域 */}
            <div
                className={`
                    ${classes.pageWrapper}
                    ${viewType === 'detail' ? classes.pageTop50 : ''}`}
            >
                {/* Success Card */}
                {viewType != 'detail' ? (
                    <div className={classes.ticketCard}>
                        <RegisterSuccessCard
                            title={ticketInfo.title}
                            subTitle={ticketInfo.subTitle}
                        />
                    </div>
                ) : null}

                {/* 门票信息 */}
                <div className={classes.infoCard}>
                    <div className={classes.rowCard}>
                        <div className={classes.infoBlock}>
                            <div className={classes.label}>Name</div>
                            <div className={classes.value}>
                                {ticketInfo.name}
                            </div>
                        </div>

                        <div className={classes.infoBlock}>
                            <div className={classes.label}>Unique Code</div>
                            <div className={classes.codeWrapper}>
                                <span
                                    className={classes.value}
                                    style={{ marginRight: '4px' }}
                                >
                                    {ticketInfo.code}
                                </span>
                                <span
                                    className={classes.copyIcon}
                                    onClick={() => handleCopy(ticketInfo.code)}
                                >
                                    <Copy size={20} color="#FF8200" />
                                    {copiedText && (
                                        <div className={classes.copiedTooltip}>
                                            <span>Code copied</span>
                                            <div
                                                className={classes.tooltipArrow}
                                            />
                                        </div>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className={classes.infoBlock}>
                            <div className={classes.label}>Event Name</div>
                            <div className={classes.value}>
                                {ticketInfo.eventName}
                            </div>
                        </div>
                        <div className={classes.infoBlock}>
                            <div className={classes.label}>Place</div>
                            <div className={classes.value}>
                                {ticketInfo.location}
                            </div>
                        </div>
                        <div className={classes.infoBlock}>
                            <div className={classes.label}>Date</div>
                            <div className={classes.value}>
                                {ticketInfo.date}
                            </div>
                        </div>
                    </div>
                    <OfflineBgCardImage />
                </div>
            </div>
        </div>
    );
};

export default ActivityFormDetailPage;
