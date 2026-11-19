import React, { useContext, useEffect, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { format, addHours } from 'date-fns';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ChevronRight } from 'react-feather';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header';
import OfflineBgImage from '../components/BgImage';
import RegisterSuccessCard from '../components/RegisterSuccessCard';
import useOfflineBookingCountdown from '../useOfflineBookingCountdown';
import { buildLink, getStorageMemberId } from '../utils';
import compClasses from './activityRegister.module.css';

const ActivityRegisterPage = props => {
    const classes = useStyle(compClasses);
    const [copiedText, setCopiedText] = useState(null);
    const { setNavConfig } = useContext(HeaderContext);

    const windowSize = useWindowSize();
    const history = useHistory();
    const [cacheData, setCacheData] = useState({});
    useOfflineBookingCountdown();

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    useEffect(() => {
        try {
            const params = sessionStorage.getItem('offlineBookingRegister');
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

    const handleRegister = () => {
        if (cacheData?.registerUrl) {
            const memberId = getStorageMemberId();
            const attachUrl = buildLink(cacheData.registerUrl, {
                member: memberId
            });
            attachUrl && window.open(attachUrl);
        }
    };
    const formatTime = val => {
        return val ? format(new Date(val), "hh:mm a 'on' dd MMMM yyyy") : '-';
    };

    const getExpireTime = (createdTimeStr, hourNum) => {
        if (!createdTimeStr || !hourNum) return '-';
        const createDate = new Date(createdTimeStr);
        const expireDate = addHours(createDate, hourNum);
        return formatTime(expireDate);
    };
    const getValidText = data => {
        const formatTime = getExpireTime(data.createdTime, data.time);
        return `The code is valid until ${formatTime}`;
    };

    return (
        <div className={`${classes.root} fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader isShowHeader={false} />
            {/* 背景栏 */}
            <OfflineBgImage />
            {/* 内容区域 */}
            <div className={classes.pageWrapper}>
                {/* Success Card */}
                <RegisterSuccessCard
                    title={cacheData.title}
                    subTitle={cacheData.subTitle}
                >
                    <button
                        className={classes.registerBtn}
                        onClick={handleRegister}
                    >
                        {cacheData.btnName || 'Register'}
                        <span className={classes.rightIcon}>
                            <ChevronRight size={20} color="#fff" />
                        </span>
                    </button>
                </RegisterSuccessCard>
                <div className={classes.codeCard}>
                    <div className={classes.codeTitle}>Registration Code</div>
                    <div className={classes.codeWrapper}>
                        <div className={classes.codeInput}>
                            {cacheData.code}
                        </div>
                        <button
                            className={classes.copyBtn}
                            onClick={() => handleCopy(cacheData.code)}
                        >
                            Copy
                            {copiedText && (
                                <div className={classes.copiedTooltip}>
                                    <span>Code copied</span>
                                    <div className={classes.tooltipArrow} />
                                </div>
                            )}
                        </button>
                    </div>

                    <div className={classes.codeTip}>
                        <span style={{ marginRight: 6 }}>•</span>
                        {getValidText(cacheData)}
                    </div>
                    <div className={classes.codeTipTwo}>
                        <span style={{ marginRight: 6 }}>•</span>
                        <FormattedMessage id="offlineBooking.quotaTips" defaultMessage="This is not the final ticket" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityRegisterPage;
