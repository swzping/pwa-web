import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useHistory } from 'react-router-dom';
import { useWindowSize } from '@magento/peregrine';
import { useQuery } from '@apollo/client';
import { ChevronRight } from 'react-feather';
import { FormattedMessage } from 'react-intl';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { format } from 'date-fns';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header/index';
import ActivityModal from '../components/Modal/activityModal';
import useOfflineBookingCountdown from '../useOfflineBookingCountdown';
import { useAllowGuestCheckout } from '../../../../../modules/peregrine/talons/AllowGuestCheckout/useAllowGuestCheckout';
import {
    getEventBookingActiveDetail,
    getCheckEventBookingEligibility
} from '../offlineEvent.gql';
import { buildLink, getStorageMemberId } from '../utils';
import compClasses from './activityDetail.module.css';

const ActivityDetailPage = props => {
    const classes = useStyle(compClasses);
    const { setNavConfig } = useContext(HeaderContext);
    const windowSize = useWindowSize();
    const history = useHistory();
    const isMobile = windowSize.innerWidth <= 767;
    const urlParams = new URLSearchParams(location.search);
    const activeId = urlParams.get('eventId');
    const [{ isSignedIn }] = useUserContext();
    const [registerLoading, setRegisterLoading] = useState(false);
    const [copiedText, setCopiedText] = useState(null);
    const [modalProps, setModalProps] = useState({
        visible: false,
        title: '',
        description: ''
    });

    const { loading, data, error } = useQuery(getEventBookingActiveDetail, {
        variables: {
            eventId: activeId
        },
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const { eventBookingDetail: activeDetail = {} } = data || {};
    const { categories: categoryList = [] } = activeDetail || {};

    const isGuardianRun = activeDetail?.event_type === 'GUARDIAN_RUN';

    const {
        loading: checkLoading,
        data: checkList,
        refetch: refetchCheck
    } = useQuery(getCheckEventBookingEligibility, {
        variables: {
            eventId: activeId
        },
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const { eventBookingEligibility: checkData = {} } = checkList || {};
    const { eventBookingCountdown } = useAllowGuestCheckout();

    useOfflineBookingCountdown({
        enabled: checkData?.event_type === 'GUARDIAN_RUN',
        eventId: activeId,
        durationSeconds: eventBookingCountdown
    });

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    useEffect(() => {
        if (!isSignedIn) {
            history.push('/sign-in');
        }
    }, [isSignedIn]);

    const closeModal = () =>
        setModalProps(prev => ({ ...prev, visible: false }));
    const openFormPage = () => {
        history.push(`/offline-activity-form?eventId=${activeId}`);
    };
    const toLinkRegister = item => {
        if (item?.register_url) {
            const memberId = getStorageMemberId();
            const attachUrl = buildLink(item.register_url, {
                member: memberId
            });
            attachUrl && window.open(attachUrl);
        }
    };
    const toSeeTickets = () => {
        history.push('/offline-ticket-list');
    };
    const toRegister = async () => {
        try {
            setRegisterLoading(true);
            const { data } = await refetchCheck({
                eventId: activeId
            });
            const latestCheckData = data?.eventBookingEligibility || {};
            const { event_type, cta_state } = latestCheckData;
            const popActions = new Set([
                'SHOW_SOLD_OUT_POPUP',
                'SHOW_NOT_QUALIFIED_POPUP',
                'SHOW_CLAIM_PERIOD_ENDED_POPUP',
                'SHOW_ALREADY_HAS_TICKET_POPUP'
            ]);
            if (popActions.has(cta_state?.action)) {
                setModalProps({
                    isGilroyFont: isGuardianRun,
                    visible: true,
                    title: cta_state?.message?.title,
                    description: cta_state?.message?.body
                });
                return;
            }
            if (event_type === 'GUARDIAN_RUN') {
                return history.push(
                    `/offline-activity-category?eventId=${activeId}`
                );
            }
            if (cta_state?.action === 'OPEN_REGISTRATION_FORM') {
                const params = new URLSearchParams();
                params.append('eventId', activeId);
                if (activeDetail?.name) {
                    params.append('eventName', activeDetail.name);
                }
                return history.push(
                    `/offline-activity-form?${params.toString()}`
                );
            }
        } finally {
            setRegisterLoading(false);
        }
    };

    const removeAllRun = str => {
        if (!str) return '';
        return str.replace(/run/gi, '')?.trim();
    };

    const formatTime = val => {
        return val ? format(new Date(val), "hh:mm a 'on' dd MMMM yyyy") : '-';
    };

    // 渲染内容
    const renderContentHtml = useMemo(() => {
        return (
            <div className={classes.richContentWrapper}>
                {activeDetail?.web_blocks?.map(item => (
                    <>
                        {item?.content?.content_html ? (
                            <RichContent html={item.content.content_html} />
                        ) : null}
                    </>
                ))}
            </div>
        );
    }, [activeDetail]);

    // 渲染按钮内容
    const renderButtonContent = useMemo(() => {
        const {
            cta_state: ctaState = {},
            existing_ticket: ticketInfo,
            event_type
        } = checkData;

        const btnTextMap = {
            WORKSHOP: 'Register',
            GUARDIAN_RUN: 'Choose Category'
        };
        // Workshop / Exhibition 已有票
        const isSeeTickets =
            ctaState?.action === 'SHOW_ALREADY_HAS_TICKET_POPUP' &&
            ['WORKSHOP', 'EXHIBITION'].includes(event_type);

        const buttonText = isSeeTickets
            ? 'See Tickets'
            : event_type === 'GUARDIAN_RUN' && categoryList.length === 1
            ? 'Claim'
            : btnTextMap[event_type] || 'Register';

        // 不支持的活动类型
        const isSupportType = [
            'GUARDIAN_RUN',
            'WORKSHOP',
            'EXHIBITION'
        ].includes(event_type);
        if (!isSupportType) return null;
        if (ctaState?.action === 'SHOW_EXISTING_GUARDIAN_RUN_CODE') {
            return (
                <div className={classes.registerWrapperBox}>
                    <div className={classes.registerWrapper}>
                        {ticketInfo ? (
                            <div className={classes.codeWrapper}>
                                <div className={classes.codeInput}>
                                    {ticketInfo?.ticket_code}
                                </div>
                                <button
                                    className={classes.copyBtn}
                                    onClick={() =>
                                        handleCopy(ticketInfo?.ticket_code)
                                    }
                                >
                                    Copy
                                    {copiedText && (
                                        <div className={classes.copiedTooltip}>
                                            <span>Code copied</span>
                                            <div
                                                className={classes.tooltipArrow}
                                            />
                                        </div>
                                    )}
                                </button>
                            </div>
                        ) : null}
                        <div className={classes.registerButtonBox}>
                            <button
                                className={classes.registerButton}
                                onClick={() => toLinkRegister(ticketInfo)}
                            >
                                Register
                                <span className={classes.registerRightIcon}>
                                    <ChevronRight size={18} color="#FF8200" />
                                </span>
                            </button>
                        </div>
                        <div className={classes.registerTipBox}>
                            <span className={classes.registerTipIcon}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <path
                                        d="M8.01562 1.5C5.67188 1.5 3.54688 2.75 2.35938 4.75C1.20312 6.78125 1.20312 9.25 2.35938 11.25C3.54688 13.2812 5.67188 14.5 8.01562 14.5C10.3281 14.5 12.4531 13.2812 13.6406 11.25C14.7969 9.25 14.7969 6.78125 13.6406 4.75C12.4531 2.75 10.3281 1.5 8.01562 1.5ZM8.01562 16C5.14062 16 2.51562 14.5 1.07812 12C-0.359375 9.53125 -0.359375 6.5 1.07812 4C2.51562 1.53125 5.14062 0 8.01562 0C10.8594 0 13.4844 1.53125 14.9219 4C16.3594 6.5 16.3594 9.53125 14.9219 12C13.4844 14.5 10.8594 16 8.01562 16ZM6.76562 10.5H7.51562V8.5H6.76562C6.32812 8.5 6.01562 8.1875 6.01562 7.75C6.01562 7.34375 6.32812 7 6.76562 7H8.26562C8.67188 7 9.01562 7.34375 9.01562 7.75V10.5H9.26562C9.67188 10.5 10.0156 10.8438 10.0156 11.25C10.0156 11.6875 9.67188 12 9.26562 12H6.76562C6.32812 12 6.01562 11.6875 6.01562 11.25C6.01562 10.8438 6.32812 10.5 6.76562 10.5ZM8.01562 6C7.45312 6 7.01562 5.5625 7.01562 5C7.01562 4.46875 7.45312 4 8.01562 4C8.54688 4 9.01562 4.46875 9.01562 5C9.01562 5.5625 8.54688 6 8.01562 6Z"
                                        fill="#FFF8E8"
                                    />
                                </svg>
                            </span>
                            <span className={classes.registerTips}>
                                <FormattedMessage
                                    id="offlineBooking.quotaTips"
                                    defaultMessage="This is not the final ticket"
                                />
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        const handleButtonClick = () => {
            if (isSeeTickets) {
                toSeeTickets();
                return;
            }
            toRegister();
        };
        return (
            <div className={classes.categoryButtonBox}>
                {ctaState?.label && (
                    <button
                        className={classes.categoryButton}
                        onClick={() => handleButtonClick()}
                    >
                        {buttonText}
                        <span className={classes.rightIcon}>
                            <ChevronRight size={18} color="#FF8200" />
                        </span>
                    </button>
                )}
            </div>
        );
    }, [checkData, copiedText, categoryList]);

    const renderQuotaList = useMemo(() => {
        const { event_type } = checkData;
        if (event_type === 'GUARDIAN_RUN') {
            return (
                <div className={classes.quotaContainer}>
                    {categoryList?.map(item => (
                        <div key={item.key} className={classes.quotaCard}>
                            <div className={classes.quotaLabel}>
                                {removeAllRun(item.label)}:
                            </div>
                            <div className={classes.quotaValue}>
                                {item.remaining_quota}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return (
            <div className={classes.quotaSingleContainer}>
                <div className={classes.quotaSingleCard}>
                    <div className={classes.quotaSingleLabel}>
                        Remaining Quota :
                    </div>
                    <div className={classes.quotaSingleValue}>
                        {activeDetail?.remaining_quota || '-'}
                    </div>
                </div>
            </div>
        );
    }, [checkData, categoryList, activeDetail]);

    const handleCopy = async val => {
        if (!val) return;
        navigator.clipboard
            .writeText(val)
            .then(() => {
                setCopiedText(val);
                setTimeout(() => setCopiedText(null), 2000);
            })
            .catch(err => console.log('coopon code error: ', err));
    };

    const loadingComponent =
        loading || checkLoading || registerLoading ? (
            <LoadingIndicator global={true} />
        ) : null;

    return (
        <div className={`${classes.root} fullPage`}>
            {/* 背景图 */}
            <div
                className={classes.pageBannerWrapper}
                style={
                    activeDetail?.banner_url
                        ? { backgroundImage: `url(${activeDetail.banner_url})` }
                        : undefined
                }
            />

            <div
                className={`${classes.pageContainer} 
                    ${isGuardianRun ? classes.gilroyFont : ''}`}
            >
                {/* 导航栏 */}
                {isMobile ? (
                    <OfflineHeader
                        headerTitle="Remaining Quota"
                        titleStyle={{ fontFamily: 'Gilroy' }}
                    />
                ) : (
                    <div className={classes.pageTitle}>Remaining Slots</div>
                )}
                <div className={classes.pageWrapper}>
                    {/* 剩余名额 */}
                    {renderQuotaList}
                    {/* 渲染按钮内容 */}
                    {renderButtonContent}
                    {/* 活动信息卡片 */}
                    <div className={classes.infoContainer}>
                        <div className={classes.infoCard}>
                            <div className={classes.infoTitle}>Gate Opens</div>
                            <div className={classes.infoValue}>
                                {formatTime(activeDetail?.gate_open_time)}
                            </div>
                            <div className={classes.infoSubtitle}>
                                <span style={{ marginRight: '10px' }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                    >
                                        <path
                                            d="M6 0C2.68629 0 0 2.68629 0 6C0 9.31371 2.68629 12 6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 0 6 0ZM8.4 7.2H6C5.66863 7.2 5.4 6.93137 5.4 6.6C5.4 6.59999 5.4 6.60001 5.4 6.6V3C5.4 2.66863 5.66863 2.4 6 2.4C6.33137 2.4 6.6 2.66863 6.6 3V6H8.4C8.73137 6 9 6.26863 9 6.6C9 6.93137 8.73137 7.2 8.4 7.2Z"
                                            fill="#FF8200"
                                        />
                                    </svg>
                                </span>
                                Event Time
                            </div>
                        </div>
                        <div className={classes.infoCard}>
                            <div className={classes.infoTitle}>
                                Plaza Parkir Timur
                            </div>
                            <div className={classes.infoValue}>
                                {activeDetail?.location}
                            </div>
                            <div className={classes.infoSubtitle}>
                                <span style={{ marginRight: '10px' }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="15"
                                        viewBox="0 0 12 15"
                                        fill="none"
                                    >
                                        <path
                                            d="M1.53384 1.79152C3.91669 -0.597172 7.78014 -0.597174 10.1627 1.79152C12.5453 4.1803 11.9899 8.05335 9.60708 10.4419L5.84829 14.7671L2.08853 10.4419C-0.294527 8.05322 -0.848968 4.18026 1.53384 1.79152ZM5.86196 3.59621C4.86169 3.59621 4.05044 4.4073 4.05044 5.40773C4.05053 6.40809 4.86179 7.21828 5.86196 7.21828C6.86211 7.21819 7.6734 6.40802 7.67349 5.40773C7.67349 4.40737 6.86216 3.5963 5.86196 3.59621Z"
                                            fill="#FF8200"
                                        />
                                    </svg>
                                </span>
                                Event Address
                            </div>
                        </div>
                    </div>
                    {renderContentHtml}
                    {loadingComponent}
                </div>
            </div>
            <ActivityModal {...modalProps} onConfirm={() => closeModal()} />
        </div>
    );
};

export default ActivityDetailPage;
