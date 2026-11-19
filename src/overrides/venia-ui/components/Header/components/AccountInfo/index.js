import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './index.module.css';
import { useHistory } from 'react-router-dom';
import { useWindowSize } from '@magento/peregrine';
import InfoPop from './InfoPop';
import { useQuery, gql } from '@apollo/client';
import { useAccountTrigger } from '@magento/peregrine/lib/talons/Header/useAccountTrigger';
import { QrCode } from '../../../../../../assets/icons';
import { ChevronRight, Settings, Bell } from 'react-feather';
import StudentPassModal from './StudentPassInfoModal';
import { Link } from 'react-router-dom';
import { GET_NOTIFITION_COUNT } from '@/modules/custom-modules/components/CustomAccountInformation/notifition.gpl.js';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import parse from "html-react-parser";


const GET_POINT_BALANCE = gql`
    query GetPointBalance {
        getBalancePoint {
            success
            code
            message
            data {
                point
            }
        }
        getExpiringPoints {
            success
            code
            message
            data {
                expiringPoint
                expiringTime
            }
        }
    }
`;

const GET_STUDENT_PASS_INFO = gql`
query customer {
    customer {
        student_data {
            is_student_pass
            student_quota
            remaining_quota
            quota_message
        }
    }
    cmsBlocks(identifiers: ["student_benefit_content"]) {
    items {
      title
      content
    }
  }
}
`;

export const GET_CUSTOMER = gql`
    query {
        customer {
            firstname
            lastname
            phonenumber
            qr_code {
                memberId
                expireTime
            }
        }
        storeConfig {
            store_code
            cms_homepage_identifer
        }
    }
`;

const GET_COUPON_COUNT = gql`
    query getCouponsCount {
        coupons(pageSize: 1, currentPage: 1) {
            totalCount
        }
    }
`;

function formatDate(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatFromRight(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber?.replace(/^(\+\d{2})(\d+)/, '$1 $2');
}
const AccountInfo = ({ onCallBack, type }) => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const [isInfoPop, setIsInfoPop] = useState(false);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const [couponCountState, setCouponCountState] = useState(0);
    const [showStudentPassModal, setShowStudentPassModal] = useState(false);

    const talonProps = useAccountTrigger();
    const {
        accountMenuIsOpen,
        accountMenuRef,
        accountMenuTriggerRef,
        setAccountMenuIsOpen,
        handleTriggerClick,
        isUserSignedIn,
        currentUser
    } = talonProps;

    const { data: couponData } = useQuery(GET_COUPON_COUNT, {
        fetchPolicy: 'cache-and-network',
        skip: !isUserSignedIn
    });

    useEffect(() => {
        if (couponData?.coupons?.totalCount !== undefined) {
            setCouponCountState(couponData.coupons.totalCount);
        }
    }, [couponData])

    const { data } = useQuery(GET_CUSTOMER, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const memberId = data?.customer?.qr_code?.memberId;

    const { data: pointData } = useQuery(GET_POINT_BALANCE, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const { data: studentPassData } = useQuery(GET_STUDENT_PASS_INFO, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    })

    const balancePoint = pointData?.getBalancePoint?.data?.point || 0;
    const expiringPoint =
        pointData?.getExpiringPoints?.data?.expiringPoint || 0;
    const expiringTime = formatDate(
        pointData?.getExpiringPoints?.data?.expiringTime
    );

    const { data: queryResponse } = useQuery(GET_NOTIFITION_COUNT, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const notificationCount = queryResponse?.getNotifications?.total_unread


    const rightContent = useMemo(() => {
        return (
            <>
                <div
                    className={`${classes.right} ${type === 'home' ? classes.homeTypeRight : ''
                        }`}
                    // style={{ marginLeft: type === 'home' ? 16 : 0 }}
                    onClick={() => {
                        // history.push('/myCouponList');
                        history.push('/couponList');
                    }}
                >
                    <img src={'/venia-static-assets/images/mi.png'} />
                    <div>
                        <div className={classes.rightTitle}>Vouchers</div>
                        <div className={classes.rightBtn}>Go use it ({couponCountState})</div>
                    </div>
                </div>
                <div
                    className={`${classes.right} ${type === 'home' ? classes.homeTypeRight : ''
                        }`}
                    style={{ opacity: 0.5 }}
                >
                    <img src={'/venia-static-assets/images/ri.png'} />
                    <div>
                        <div className={classes.rightTitle}>G-STORE</div>
                        <div className={classes.rightBtn}>Go redeem it</div>
                    </div>
                </div>
            </>
        );
    }, [classes, type, history, couponCountState]);

    const formatPoints = value => {
        const stringValue = String(value != null ? value : '');
        const isNegative = stringValue.trim().startsWith('-');
        const raw = stringValue.replace(/[^0-9]/g, '');
        if (raw === '') return '0';
        const formatted = Number(raw).toLocaleString();;
        return isNegative ? `-${formatted}` : formatted;
    };
    const studentPassTag = useMemo(() => {
        return studentPassData?.customer?.student_data?.is_student_pass && type !== 'home' ? (
            <>
                <div className={classes.studentPassTag} onClick={() => setShowStudentPassModal(true)}>
                    <div className={classes.studentPassTagContent}>
                        <div className={classes.studentPassTagInfo}>
                            <img className={classes.studentPassIcon} src='/venia-static-assets/images/student_pass_icon.png' alt="studentPass" />
                            <div className={classes.studentPassText}>student</div>
                        </div>
                        <div className={classes.studentPassTagInfo}>
                            <div className={classes.studentPassSchedule}>{studentPassData?.customer?.student_data?.remaining_quota || 0}/{studentPassData?.customer?.student_data?.student_quota || 0}</div>
                            {/* <ChevronRight size={10} color='#757575' /> */}
                        </div>
                    </div>
                    <div className={classes.studentPassProgress}>
                        <div className={classes.studentPassProgressBar} style={{ width: `${(studentPassData?.customer?.student_data?.remaining_quota || 0) / (studentPassData?.customer?.student_data?.student_quota || 0) * 100}%` }}></div>
                    </div>
                </div>

                {(<div className={classes.studentPassTagTip}>{parse(studentPassData?.customer?.student_data?.quota_message || '')}</div>)}
            </>
        ) : null
    }, [classes, studentPassData, type])

    return (
        <div
            className={`${classes.wrap} ${type === 'home' && !isMobile ? classes.homeTypeWrap : ''
                }`}
        >
            {isUserSignedIn && (
                <div
                    className={`${classes.left} ${type === 'home' ? classes.homeTypeleft : ''
                        }`}
                >
                    <div className={classes.leftTitle} onClick={() => {
                        history.push({
                            pathname: '/my-account-information'
                        });
                    }}>
                        <div className={classes.leftTitleLoginEd}>
                            <span className={classes.customerName}>Hi, {data?.customer?.firstname?.split(' ')?.[0] || data?.customer?.firstname || ' '}!</span>
                            <span className={classes.phoneNum}>
                                {formatFromRight(data?.customer?.phonenumber)}
                            </span>
                            {false && (
                                <div
                                    className={classes.qrcode}
                                    onClick={() => {
                                        history.push({
                                            pathname: '/qrcode',
                                            state: {
                                                memberId
                                            }
                                        });
                                    }}
                                >
                                    <span>QR Code</span>
                                    <svg
                                        style={{ marginLeft: 4 }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <rect
                                            width="16"
                                            height="16"
                                            rx="8"
                                            fill="white"
                                        />
                                        <path
                                            d="M6 12L10 8L6 4"
                                            stroke="#FF8200"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {isMobile && studentPassTag}
                        <div className={classes.infoWrap}>
                            <div
                                style={{
                                    width: type === 'home' ? '100%' : 'auto'
                                }}
                                className={classes.leftInfo}
                            >
                                <div className={classes.leftNum}>
                                    <img
                                        src={
                                            '/venia-static-assets/images/gim.png'
                                        }
                                    />
                                    <span style={{ margin: '0 2px' }}>{formatPoints(balancePoint)}</span>
                                    <svg
                                        aria-label="Point information"
                                        role="button"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 32 32"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{ cursor: 'pointer' }}
                                        onClick={event => {
                                            event.stopPropagation();
                                            setIsInfoPop(true);
                                        }}
                                    >
                                        <path
                                            d="M16 6.25C12.4844 6.25 9.29688 8.125 7.51562 11.125C5.78125 14.1719 5.78125 17.875 7.51562 20.875C9.29688 23.9219 12.4844 25.75 16 25.75C19.4688 25.75 22.6562 23.9219 24.4375 20.875C26.1719 17.875 26.1719 14.1719 24.4375 11.125C22.6562 8.125 19.4688 6.25 16 6.25ZM16 28C11.6875 28 7.75 25.75 5.59375 22C3.4375 18.2969 3.4375 13.75 5.59375 10C7.75 6.29688 11.6875 4 16 4C20.2656 4 24.2031 6.29688 26.3594 10C28.5156 13.75 28.5156 18.2969 26.3594 22C24.2031 25.75 20.2656 28 16 28ZM14.125 19.75H15.25V16.75H14.125C13.4688 16.75 13 16.2812 13 15.625C13 15.0156 13.4688 14.5 14.125 14.5H16.375C16.9844 14.5 17.5 15.0156 17.5 15.625V19.75H17.875C18.4844 19.75 19 20.2656 19 20.875C19 21.5312 18.4844 22 17.875 22H14.125C13.4688 22 13 21.5312 13 20.875C13 20.2656 13.4688 19.75 14.125 19.75ZM16 13C15.1562 13 14.5 12.3438 14.5 11.5C14.5 10.7031 15.1562 10 16 10C16.7969 10 17.5 10.7031 17.5 11.5C17.5 12.3438 16.7969 13 16 13Z"
                                            fill="white"
                                        />
                                    </svg>
                                </div>
                                <div className={classes.leftDate}>
                                    {!!expiringPoint && (
                                        <span>
                                            {formatPoints(expiringPoint)} points will expire by{' '}
                                            {expiringTime}
                                        </span>
                                    )}
                                    {/* <div className={classes.pointHistory} onClick={(e) => {
                                        e.stopPropagation();
                                        history.push({
                                            pathname: '/my-account-information',
                                            state: { tabId: 'myPoints' }
                                        });
                                    }}> Point history &gt; </div> */}
                                </div>

                                {/* <div
                                    className={classes.memo}
                                    style={{
                                        display:
                                            type === 'home' ? 'none' : 'flex',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        history.push('/benefits');
                                    }}
                                >
                                    <div>
                                        <svg
                                            width="16"
                                            height="17"
                                            viewBox="0 0 16 17"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M0.125 1.21875C0.03125 1.09375 0 0.9375 0 0.78125C0 0.34375 0.34375 0 0.75 0H4.15625C4.53125 0 4.84375 0.1875 5.03125 0.5L7.15625 4.0625C5.65625 4.25 4.3125 4.96875 3.3125 6L0.125 1.21875ZM15.8438 1.21875L12.6562 6C11.6562 4.96875 10.3125 4.25 8.8125 4.0625L10.9375 0.5C11.125 0.1875 11.4375 0 11.8125 0H15.2188C15.6562 0 16 0.34375 16 0.78125C16 0.9375 15.9375 1.09375 15.8438 1.21875ZM2.5 10.5C2.5 8.5625 3.53125 6.75 5.25 5.75C6.9375 4.78125 9.03125 4.78125 10.75 5.75C12.4375 6.75 13.5 8.5625 13.5 10.5C13.5 12.4688 12.4375 14.2812 10.75 15.2812C9.03125 16.25 6.9375 16.25 5.25 15.2812C3.53125 14.2812 2.5 12.4688 2.5 10.5ZM8.25 7.5625C8.15625 7.34375 7.84375 7.34375 7.71875 7.5625L7.03125 8.96875C6.96875 9.0625 6.90625 9.125 6.8125 9.125L5.25 9.34375C5 9.375 4.90625 9.6875 5.0625 9.84375L6.21875 10.9688C6.28125 11.0312 6.3125 11.125 6.28125 11.2188L6.03125 12.7812C5.96875 13.0312 6.21875 13.1875 6.4375 13.0938L7.84375 12.3438C7.9375 12.3125 8.03125 12.3125 8.125 12.3438L9.53125 13.0938C9.75 13.1875 10 13.0312 9.9375 12.7812L9.6875 11.2188C9.65625 11.125 9.6875 11.0312 9.75 10.9688L10.9062 9.84375C11.0625 9.6875 10.9688 9.40625 10.7188 9.34375L9.15625 9.125C9.0625 9.125 9 9.0625 8.9375 8.96875L8.25 7.5625Z"
                                                fill="#222222"
                                            />
                                        </svg>
                                        <div className={classes.benefits}>
                                            Benefits: See what's in member
                                            benefits
                                        </div>
                                    </div>
                                    <svg
                                        width="5"
                                        height="9"
                                        viewBox="0 0 5 9"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{ marginLeft: 2 }}
                                    >
                                        <path
                                            d="M4.60938 3.92578C4.78516 4.12109 4.78516 4.41406 4.60938 4.58984L0.859375 8.33984C0.664062 8.53516 0.371094 8.53516 0.195312 8.33984C0 8.16406 0 7.87109 0.195312 7.69531L3.61328 4.27734L0.195312 0.839844C0 0.664062 0 0.371094 0.195312 0.195312C0.371094 0 0.664062 0 0.839844 0.195312L4.60938 3.92578Z"
                                            fill="#757575"
                                        />
                                    </svg>
                                    </div> */}
                                {isMobile && (<div className={classes.healthReportWrap} onClick={(e) => {
                                    e.stopPropagation();
                                    history.push({
                                        pathname: '/my-account-information',
                                        state: { tabId: 'healthReport' }
                                    });
                                }}>
                                    <img className={classes.healthReportBlackIcon} src='/venia-static-assets/images/health_report_black_icon.png' />
                                    <div className={classes.healthReportSmallTitle}>Health Report</div>
                                    <ChevronRight size={16} color='#757575' />
                                </div>)}
                            </div>
                        </div>
                    </div>
                    {
                        isMobile && <div style={{ display: 'flex', flexDirection: 'column' }} >
                            <div className={classes.rightSomeIconWrap}>
                                {type !== 'home' && (<div className={classes.rightSomeIconInfo}>
                                    <Link to={resourceUrl('/account-information')}>
                                        <Settings size={28} color='#fff' />
                                    </Link>
                                    <Link to={resourceUrl('/notification-info')} style={{ position: 'relative' }}>
                                        <Bell size={28} color='#fff' />
                                        {!!notificationCount && <div className={`${classes.notificationCount} ${notificationCount < 100 ? '' : classes.notificationCountLarge}`} >
                                            {notificationCount > 99 ? `99+` : `${notificationCount}`}
                                        </div>}
                                    </Link>
                                </div>)}
                            </div>
                            <div onClick={() => {
                                history.push({
                                    pathname: '/qrcode',
                                    state: {
                                        memberId
                                    }
                                });
                            }}>
                                <QrCode />
                            </div>
                        </div>
                    }
                    {!isMobile && (
                        <div className={classes.rightWrap}>
                            {!isMobile && studentPassTag}
                            <div className={classes.healthReportContent} onClick={() => {
                                history.push({
                                    pathname: '/my-account-information',
                                    state: { tabId: 'healthReport' }
                                });
                            }}>
                                <div className={classes.healthReportInfo}>
                                    <div className={classes.healthReportTitle}>Health Report</div>
                                    <div className={classes.healthReportBtn}>Go Check It</div>
                                </div>
                                <img className={classes.healthReportIcon} src='/venia-static-assets/images/health_report_icon.png' alt="healthReport" />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!isUserSignedIn && (
                <div className={classes.noLoginleft}>
                    <div
                        className={classes.noLoginText}
                        onClick={() => {
                            history.push('/sign-in');
                        }}
                    >
                        Login/Register
                    </div>
                    <span>Get Rp10.000 off on your 1st Purchase!</span>
                </div>
            )}
            {!isMobile && isUserSignedIn && rightContent}
            {/* {isMobile && (
                <div className={classes.rightWrap}>
                    <div>{rightContent}</div>
                </div>
            )} */}
            {isInfoPop && (
                <InfoPop
                    cms={data?.storeConfig?.cms_homepage_identifer}
                    onClose={() => setIsInfoPop(false)}
                />
            )}

            <StudentPassModal cmsBlocks={studentPassData?.cmsBlocks} quota_message={studentPassData?.customer?.student_data?.quota_message} open={showStudentPassModal} onClose={() => setShowStudentPassModal(false)} />
        </div>
    );
};

export default AccountInfo;
