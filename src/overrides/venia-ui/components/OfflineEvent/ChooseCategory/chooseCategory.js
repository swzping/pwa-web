import React, { useContext, useEffect, useState } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { ChevronRight } from 'react-feather';
import { useHistory } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header';
import OfflineBgImage from '../components/BgImage';
import ActivityModal from '../components/Modal/activityModal';
import useOfflineBookingCountdown from '../useOfflineBookingCountdown';

import {
    getEventBookingActiveDetail,
    submitClaimGuardianRunCode
} from '../offlineEvent.gql';
import compClasses from './chooseCategory.module.css';

const errorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

const ChooseCategoryPage = () => {
    const classes = useStyle(compClasses);
    const { setNavConfig } = useContext(HeaderContext);
    const [, { addToast }] = useToasts();
    const windowSize = useWindowSize();
    const history = useHistory();
    const [loadingClick, setLoadingClick] = useState(false);
    const [modalProps, setModalProps] = useState({
        visible: false,
        title: '',
        description: ''
    });

    const isMobile = windowSize.innerWidth <= 767;
    const urlParams = new URLSearchParams(location.search);
    const activeId = urlParams.get('eventId');

    const { loading, data, error, refetch: refetchDetail } = useQuery(getEventBookingActiveDetail, {
        variables: {
            eventId: activeId
        },
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });
    const { eventBookingDetail: activeDetail } = data || {};
    const { categories: categoryList = [] } = activeDetail || {};
    useOfflineBookingCountdown();

    const [submitRunClick] = useMutation(submitClaimGuardianRunCode, {
        fetchPolicy: 'no-cache'
    });

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    const handleItemClick = async item => {
        const isPopup = [
            'SHOW_SOLD_OUT_POPUP',
            'SHOW_NOT_QUALIFIED_POPUP',
            'SHOW_CLAIM_PERIOD_ENDED_POPUP',
            'SHOW_ALREADY_HAS_TICKET_POPUP'
        ];
        const isToResult = ['SHOW_EXISTING_GUARDIAN_RUN_CODE'];
        try {
            setLoadingClick(true);
            const { data } = await submitRunClick({
                variables: {
                    input: {
                        event_id: activeId,
                        category_code: item.code
                    }
                }
            });
            const result = data?.claimGuardianRunCode || {};
            if (isPopup.includes(result?.cta_state?.action)) {
                setModalProps({
                    visible: true,
                    title: result?.message?.title,
                    description: result?.message?.body
                });
                return;
            }
            if (isToResult.includes(result?.cta_state?.action)) {
                const params = {
                    title: result?.message?.title,
                    subTitle: result?.message?.body,
                    btnName: result?.cta_state?.label,
                    createdTime: result?.ticket?.created_at,
                    time: result?.ticket?.code_timeout_hours,
                    code: result?.ticket?.ticket_code,
                    registerUrl: result?.ticket?.register_url
                };
                sessionStorage.setItem(
                    'offlineBookingRegister',
                    JSON.stringify(params)
                );
                history.replace('/offline-activity-register');
            }
        } catch (error) {
            if (String(error)) {
                addToast({
                    type: 'error',
                    icon: errorIcon,
                    message: String(error),
                    timeout: 3000
                });
            }
        } finally {
            setLoadingClick(false);
        }
    };

    const removeAllRun = str => {
        if (!str) return '';
        return str.replace(/run/gi, '')?.trim();
    };

    const closeModal = () => {
        setModalProps(prev => ({ ...prev, visible: false }));
        refetchDetail();
    }

    const loadingComponent = loadingClick || loading ? (
        <LoadingIndicator global={true} />
    ) : null;

    return (
        <div className={`${classes.root} mobileBottomNoneFlag fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader
                headerTitle={activeDetail?.name || ''}
                titleStyle={{ fontFamily: 'Gilroy' }}
            />
            {/* 背景栏 */}
            <OfflineBgImage />
            {/* 内容区域 */}
            <div className={classes.pageWrapper}>
                <p className={classes.subQuota}>Remaining Slots</p>
                {/* stats card */}
                <div className={classes.statsRow}>
                    {categoryList?.map(item => (
                        <div
                            key={item.code}
                            className={`${classes.statCard} ${
                                item?.is_sold_out
                                    ? classes.statCardDisabled
                                    : ''
                            }`}
                        >
                            <div className={classes.statTitle}>
                                {removeAllRun(item.label)}:
                            </div>
                            <div className={classes.statValue}>
                                {item.remaining_quota}
                            </div>
                        </div>
                    ))}
                </div>

                {/* banner card */}
                {!isMobile && activeDetail?.category_banner_url ? (
                    <img
                        className={classes.bannerImgCard}
                        src={activeDetail.category_banner_url}
                    />
                ) : null}

                {/* category card */}
                <div className={classes.categoryCard}>
                    <p className={classes.subTitle}>
                        Choose your race categories
                    </p>
                    <div className={classes.runWrapperBox}>
                        {categoryList?.map(item => (
                            <div
                                key={item.key}
                                className={classes.runWrapper}
                                onClick={() => handleItemClick(item)}
                            >
                                {isMobile ? (
                                    <button
                                        className={`${classes.runButton} ${
                                            item?.is_sold_out
                                                ? classes.runButtonDisabled
                                                : ''
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ) : (
                                    <div className={classes.runButtonBox}>
                                        <div className={classes.runLabel}>
                                            {item.label}
                                        </div>
                                        <button
                                            className={`${classes.runButton} ${
                                                item?.is_sold_out
                                                    ? classes.runButtonDisabled
                                                    : ''
                                            }`}
                                        >
                                            SELECT
                                            {!isMobile && (
                                                <span
                                                    className={
                                                        classes.rightIcon
                                                    }
                                                >
                                                    <ChevronRight
                                                        size={24}
                                                        color="#fff"
                                                    />
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Activity Modal */}
                <ActivityModal {...modalProps} onConfirm={() => closeModal()} />
                {loadingComponent}
            </div>
        </div>
    );
};

export default ChooseCategoryPage;
