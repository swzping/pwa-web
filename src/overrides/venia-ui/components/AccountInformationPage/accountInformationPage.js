import React, {
    Fragment,
    Suspense,
    useMemo,
    useContext,
    useEffect,
    useState
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useAccountInformationPage } from '@magento/peregrine/lib/talons/AccountInformationPage/useAccountInformationPage';
import { Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import { Message } from '@magento/venia-ui/lib/components/Field';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';

// import defaultClasses from '@magento/venia-ui/lib/components/AccountInformationPage/accountInformationPage.module.css';
import defaultClasses from './accountInformationPage.module.css';
import AccountInformationPageOperations from './accountInformationPage.gql.js';
import { useRewardPointPage } from '../../../../modules/peregrine/talons/RewardPointPage/useRewardPointPage';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';
import WishlistItems from '@magento/venia-ui/lib/components/WishlistPage/wishlistItems';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { HeaderContext } from '../../../peregrine/context/header';

import Tabs from '@magento/pagebuilder/lib/ContentTypes/Tabs';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import EditForm from './editForm';
import TabItem from '@magento/pagebuilder/lib/ContentTypes/TabItem';
import AddressInfo from '../../../../modules/custom-modules/components/CustomAccountInformation/AddressInfo';
import AccountInfo from '../../../../modules/custom-modules/components/CustomAccountInformation/AccountInfo';
import NotifitionInfo from '../../../../modules/custom-modules/components/CustomAccountInformation/NotifitionInfo.js';
import HealthList from '../../../../modules/custom-modules/components/CustomAccountInformation/HealthList.js';
import AccountOrderHistory from '../../../../modules/custom-modules/components/CustomAccountInformation/AccountOrderHistory';
import AccountSetting from '../../../../modules/custom-modules/components/CustomAccountInformation/AccountSetting';
import MedicalPage from '../../../../modules/swift-pwa-ui/components/MedicalPage/medicalPage';
import ModalMedical from '../../../../modules/swift-pwa-ui/components/ApotekerLandingPage/modalMedical';

import { useHistory } from 'react-router-dom';
import { useAccountInformationCacheClear } from '../../../peregrine/hooks/useAccountInformationCacheClear';
import { useQuery } from '@apollo/client';
import useRevokeCustomerToken from '@/lib/useRevokeCustomerToken';
import { GET_NOTIFITION_LIST, GET_NOTIFITION_COUNT } from '../../../../modules/custom-modules/components/CustomAccountInformation/notifition.gpl.js';
import MyCouponList from '../../../../modules/swift-pwa-ui/components/MyCoupon/index';

const EditModal = React.lazy(() => import('./editModal'));

const AccountInformationPage = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const userContext = useUserContext();
    const revokeToken = useRevokeCustomerToken();
    const { setNavConfig } = useContext(HeaderContext);

    const { customerRewardPoints } = useRewardPointPage();

    const talonProps = useAccountInformationPage({
        ...AccountInformationPageOperations
    });

    const [isOpen, setIsOpen] = React.useState(false);
    const [currentItem, setCurrentItem] = useState({ id: 'myAccount' });

    const {
        handleCancel,
        formErrors,
        handleChangePassword,
        handleSubmit,
        initialValues,
        isDisabled,
        customerInformationUpdateCalled,
        isUpdateMode,
        loadDataError,
        shouldShowNewPassword,
        showUpdateMode,
        handleRegisterMedical
    } = talonProps;
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { data: queryResponse } = useQuery(GET_NOTIFITION_COUNT, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const notificationCount = queryResponse?.getNotifications?.total_unread;

    const ItemNav = () => {
        return <span className={classes.iconNext}>
                <svg
                    width="9"
                    height="15"
                    viewBox="0 0 9 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M8.84375 7.40625L8.125 8.125L2.125 14.125L1.4375 14.8438L0 13.4062L0.71875 12.7188L6 7.40625L0.71875 2.125L0 1.40625L1.4375 0L2.125 0.71875L8.125 6.71875L8.84375 7.40625Z"
                        fill="#BDBDBD"
                    />
                </svg>
            </span>
    }

    // 启用缓存清除功能，当用户离开 /account-information 路径时清除缓存
    useAccountInformationCacheClear({
        enabled: true,
        clearTypes: ['customer', 'cart', 'localStorage', 'sessionStorage']
    });

    useEffect(() => {
        if (localStorage.getItem('accountTab') == 1) {
            const activeLi = document.querySelector(
                '#accountDom li:nth-child(2)'
            );
            activeLi?.click();
            const activeAh5 = document.querySelector(
                '#accountH5Dom a:nth-child(2)'
            );
            activeAh5?.click();
        } else if (localStorage.getItem('accountTab') == 2) {
            const activeLi = document.querySelector(
                '#accountDom li:nth-child(4)'
            );
            activeLi?.click();
        }
        setNavConfig({
            headerTitle: 'Menu'
        });
    }, []);

    const errorMessage = loadDataError ? (
        <Message>
            <FormattedMessage
                id={'accountInformationPage.errorTryAgain'}
                defaultMessage={
                    'Something went wrong. Please refresh and try again.'
                }
            />
        </Message>
    ) : null;

    let headerContent = null;
    let wishListContent = null;
    let editForm = null;
    if (!initialValues) {
        // return fullPageLoadingIndicator;
        return (
            <>
                <div style={{ marginBottom: '16px' }}>
                    <Shimmer
                        key="account-page-header"
                        width="100%"
                        height="150px"
                    />
                </div>
                <div>
                    <Shimmer
                        key="account-page-content"
                        width="100%"
                        height="400px"
                    />
                </div>
            </>
        );
    } else {
        const { customer } = initialValues;
        const customerName = `${customer.firstname} ${customer.lastname}`;
        const passwordValue = '***********';

        wishListContent = customer.wishlists[0].items_count ? (
            <WishlistItems
                isAccountInfo
                items={customer.wishlists[0].items_v2.items}
                wishlistId={customer.wishlists[0].id}
            />
        ) : (
            <p className={classes.wishlistEmpty}>
                {/* <FormattedMessage
                    id={'wishlist.emptyListText'}
                    defaultMessage={'There are currently no items in this list'}
                /> */}
                Your wishlist is empty
            </p>
        );

        editForm = (
            <>
                <AccountInfo
                    formErrors={formErrors}
                    initialValues={customer}
                    isDisabled={isDisabled}
                    isOpen={isUpdateMode}
                    customerInformationUpdateCalled={
                        customerInformationUpdateCalled
                    }
                    onCancel={handleCancel}
                    onChangePassword={handleChangePassword}
                    onSubmit={handleSubmit}
                    shouldShowNewPassword={shouldShowNewPassword}
                />
            </>
        );

        headerContent = (
            <div className={classes.headerContainer}>
                <p className={classes.customerName}>{customerName}</p>
                <p className={classes.customerEmail}>{customer.email}</p>
                <div className={classes.headerPoint}>
                    <p className={classes.pointTitle}>
                        <FormattedMessage
                            id={'accountSetting.myPoint'}
                            defaultMessage={'My Point'}
                        />
                    </p>
                    <p className={classes.pointValue}>
                        {customerRewardPoints.formatedBalanceCurrency}
                    </p>
                </div>

                <Suspense fallback={null}>
                    <EditModal
                        formErrors={formErrors}
                        initialValues={customer}
                        isDisabled={isDisabled}
                        isOpen={isUpdateMode}
                        onCancel={handleCancel}
                        onChangePassword={handleChangePassword}
                        onSubmit={handleSubmit}
                        shouldShowNewPassword={shouldShowNewPassword}
                    />
                </Suspense>
            </div>
        );
    }

    const TabTitle = [
        // <div className="d-flex align-items-center">
        //     <i className={`${classes.iconCustom} icon-icon-health`} />
        //     <p
        //         style={{
        //             marginLeft: '15px',
        //             marginBottom: 0,
        //             fontSize: '14px',
        //             color: '#000000'
        //         }}
        //     >
        //         {initialValues.customer.is_register_test !== 1 ? (
        //             <>Daftar Kesehatan</>
        //         ) : (
        //             <>Lihat Hasil Kesehatan</>
        //         )}
        //     </p>
        // </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-bags`} />
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.myOrder'}
                    defaultMessage={'My Orders'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-orange_notifition`} />
            <div
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000',
                    position: 'relative'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.notification'}
                    defaultMessage={'Notification'}
                />
                {!!notificationCount && (
                    <div
                        className={`${classes.notificationCount} ${notificationCount < 100
                            ? ''
                            : classes.notificationCountLarge
                            }`}
                    >
                        {notificationCount > 99
                            ? `99+`
                            : `${notificationCount}`}
                    </div>
                )}
            </div>
        </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-user`} />
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.accountInformation'}
                    defaultMessage={'Account Information'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <svg
                width="18"
                height="24"
                viewBox="0 0 18 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M2.25 21C2.25 21.4219 2.57812 21.75 3 21.75H15C15.375 21.75 15.75 21.4219 15.75 21V7.5H12C11.1562 7.5 10.5 6.84375 10.5 6V2.25H3C2.57812 2.25 2.25 2.625 2.25 3V21ZM3 0H10.7344C11.5312 0 12.2812 0.328125 12.8438 0.890625L17.1094 5.15625C17.6719 5.71875 18 6.46875 18 7.26562V21C18 22.6875 16.6406 24 15 24H3C1.3125 24 0 22.6875 0 21V3C0 1.35938 1.3125 0 3 0ZM10.125 13.125V19.125C10.125 19.7812 9.60938 20.25 9 20.25C8.34375 20.25 7.875 19.7812 7.875 19.125V13.125C7.875 12.5156 8.34375 12 9 12C9.60938 12 10.125 12.5156 10.125 13.125ZM14.25 14.625V19.125C14.25 19.7812 13.7344 20.25 13.125 20.25C12.4688 20.25 12 19.7812 12 19.125V14.625C12 14.0156 12.4688 13.5 13.125 13.5C13.7344 13.5 14.25 14.0156 14.25 14.625ZM6 16.125V19.125C6 19.7812 5.48438 20.25 4.875 20.25C4.21875 20.25 3.75 19.7812 3.75 19.125V16.125C3.75 15.5156 4.21875 15 4.875 15C5.48438 15 6 15.5156 6 16.125Z"
                    fill="#212121"
                />
            </svg>

            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.healthReport'}
                    defaultMessage={'Laporan Kesahatan'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-address`} />
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.addressBook'}
                    defaultMessage={'Address Book'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <span className={classes.iconCustom}>
                <i className="fa fa-cog" aria-hidden="true" />
            </span>
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.setting'}
                    defaultMessage={'Setting'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-orange_love`} />
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.wishlist'}
                    defaultMessage={'Wishlist'}
                />
            </p>
        </div>,
        <div className="d-flex align-items-center">
            <i className={`${classes.iconCustom} icon-orange_coupon`} />
            <p
                style={{
                    marginLeft: '15px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: '#000000'
                }}
            >
                <FormattedMessage
                    id={'accountSetting.myCoupon'}
                    defaultMessage={'My Coupon'}
                />
            </p>
        </div>
    ];

    return (
        <>
            {/* {errorMessage ? errorMessage : headerContent} */}
            <div
                className={`${classes.root} hidden-desktop`}
                style={{ backgroundColor: '#FFFFFF' }}
                id="accountH5Dom"
            >
                {/* {initialValues.customer.is_register_test !== 1 ? (
                    <button
                        className={`${classes.accountLink} free`}
                        onClick={() => {
                            setIsOpen(true);
                        }}
                    >
                        <span>Daftar Check Kesehatan</span>
                    </button>
                ) : (
                    <Link to="/medical-test/results" className={classes.accountLink}>
                        <i className={`${classes.iconCustom} icon-icon-health`} />
                        <span>Lihat Hasil Cek Kesehatan</span>
                        <span className={classes.iconNext}>
                            <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.84375 7.40625L8.125 8.125L2.125 14.125L1.4375 14.8438L0 13.4062L0.71875 12.7188L6 7.40625L0.71875 2.125L0 1.40625L1.4375 0L2.125 0.71875L8.125 6.71875L8.84375 7.40625Z" fill="#BDBDBD"/>
</svg>

                        </span>
                    </Link>
                ) } */}
                <div className={classes.typeTitle}>Account Information</div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'myAccount' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M14.6875 14.5C15.8125 13.3438 16.5 11.75 16.5 10C16.5 6.4375 13.5625 3.5 10 3.5C6.40625 3.5 3.5 6.4375 3.5 10C3.5 11.75 4.15625 13.3438 5.28125 14.5C5.875 13.0312 7.3125 12 9 12H11C12.6562 12 14.0938 13.0312 14.6875 14.5ZM13.4375 15.5312C13.2188 14.375 12.1875 13.5 11 13.5H9C7.78125 13.5 6.75 14.375 6.53125 15.5312C7.53125 16.1562 8.71875 16.5 10 16.5C11.25 16.5 12.4375 16.1562 13.4375 15.5312ZM10 18C7.125 18 4.5 16.5 3.0625 14C1.625 11.5312 1.625 8.5 3.0625 6C4.5 3.53125 7.125 2 10 2C12.8438 2 15.4688 3.53125 16.9062 6C18.3438 8.5 18.3438 11.5312 16.9062 14C15.4688 16.5 12.8438 18 10 18ZM10 9.5C10.4375 9.5 10.8438 9.28125 11.0625 8.875C11.2812 8.5 11.2812 8.03125 11.0625 7.625C10.8438 7.25 10.4375 7 10 7C9.53125 7 9.125 7.25 8.90625 7.625C8.6875 8.03125 8.6875 8.5 8.90625 8.875C9.125 9.28125 9.53125 9.5 10 9.5ZM7.25 8.25C7.25 7.28125 7.75 6.375 8.625 5.875C9.46875 5.40625 10.5 5.40625 11.375 5.875C12.2188 6.375 12.75 7.28125 12.75 8.25C12.75 9.25 12.2188 10.1562 11.375 10.6562C10.5 11.125 9.46875 11.125 8.625 10.6562C7.75 10.1562 7.25 9.25 7.25 8.25Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>My Account</span>
                    <ItemNav />
                </div>

                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'addressList' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M13.75 5.75C13.75 6.03125 13.6875 6.34375 13.5938 6.65625C13.4062 7.21875 13.0938 7.875 12.7188 8.5C12.625 8.6875 12.5312 8.84375 12.4062 9C12.2812 9.21875 12.1562 9.4375 12 9.65625V9.6875C11.4062 10.5312 10.8438 11.2812 10.4375 11.75C10.2188 12.0625 9.75 12.0625 9.53125 11.75C9.125 11.2812 8.5625 10.5312 8 9.6875C7.40625 8.84375 6.84375 7.875 6.53125 7.03125C6.5 6.96875 6.46875 6.90625 6.46875 6.84375C6.3125 6.46875 6.25 6.09375 6.25 5.78125C6.25 5.625 6.25 5.46875 6.25 5.34375C6.46875 3.46875 8.0625 2 10 2C12.0625 2 13.75 3.6875 13.75 5.75ZM12 11.4062C12.4062 10.8438 12.875 10.1562 13.3125 9.46875C13.375 9.375 13.4375 9.28125 13.5 9.1875V16.1875L17.5 14.75V6.84375L14.0938 8.0625C14.1562 7.9375 14.2188 7.78125 14.2812 7.625C14.4688 7.1875 14.625 6.71875 14.6875 6.25L17.9688 5.0625C18.2188 4.96875 18.4688 5 18.6562 5.15625C18.875 5.28125 19 5.53125 19 5.75V15.25C19 15.5938 18.7812 15.875 18.5 15.9688L13 17.9688C12.8125 18.0312 12.6562 18.0312 12.4688 17.9688L7.25 16.0625L2 17.9688C1.75 18.0625 1.5 18.0312 1.3125 17.875C1.09375 17.75 1 17.5 1 17.25V7.75C1 7.4375 1.1875 7.15625 1.46875 7.0625L5.25 5.6875C5.25 5.71875 5.25 5.75 5.25 5.75C5.25 6.25 5.34375 6.71875 5.5 7.1875L2.5 8.28125V16.1875L6.5 14.75V9.1875C6.53125 9.28125 6.59375 9.375 6.65625 9.46875C7.09375 10.1562 7.5625 10.8438 8 11.4062V14.75L12 16.1875V11.4062ZM10 6.75C10.4375 6.75 10.8438 6.53125 11.0625 6.125C11.2812 5.75 11.2812 5.28125 11.0625 4.875C10.8438 4.5 10.4375 4.25 10 4.25C9.53125 4.25 9.125 4.5 8.90625 4.875C8.6875 5.28125 8.6875 5.75 8.90625 6.125C9.125 6.53125 9.53125 6.75 10 6.75Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Address List</span>
                    <ItemNav />
                </div>
                {/* <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'storeCredits' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M17 4.5H3C2.71875 4.5 2.5 4.75 2.5 5V6H17.5V5C17.5 4.75 17.25 4.5 17 4.5ZM17.5 9H2.5V15C2.5 15.2812 2.71875 15.5 3 15.5H17C17.25 15.5 17.5 15.2812 17.5 15V9ZM3 3H17C18.0938 3 19 3.90625 19 5V15C19 16.125 18.0938 17 17 17H3C1.875 17 1 16.125 1 15V5C1 3.90625 1.875 3 3 3ZM4.75 12.5H6.25C6.65625 12.5 7 12.8438 7 13.25C7 13.6875 6.65625 14 6.25 14H4.75C4.3125 14 4 13.6875 4 13.25C4 12.8438 4.3125 12.5 4.75 12.5ZM8.75 12.5H12.25C12.6562 12.5 13 12.8438 13 13.25C13 13.6875 12.6562 14 12.25 14H8.75C8.3125 14 8 13.6875 8 13.25C8 12.8438 8.3125 12.5 8.75 12.5Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Store Credits</span>
                    <ItemNav />
                </div> */}
                {/* <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'product' }
                    });
                }}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M11.6875 2.5H8.75V5H13.125L12.1562 2.8125C12.0625 2.625 11.875 2.5 11.6875 2.5ZM13.5 6.5H2.5V13C2.5 13.2812 2.71875 13.5 3 13.5H13C13.25 13.5 13.5 13.2812 13.5 13V6.5ZM2.84375 5H7.25V2.5H4.28125C4.09375 2.5 3.90625 2.625 3.84375 2.8125L2.84375 5ZM11.6875 1C12.4688 1 13.1875 1.46875 13.5 2.1875L14.8125 5.125C14.9375 5.375 15 5.65625 15 5.9375V13C15 14.125 14.0938 15 13 15H3C1.875 15 1 14.125 1 13V5.9375C1 5.65625 1.03125 5.375 1.15625 5.125L2.46875 2.1875C2.78125 1.46875 3.5 1 4.28125 1H11.6875Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Product</span>
                    <ItemNav />
                </div> */}
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'healthReport' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M14 16.5C14.25 16.5 14.5 16.2812 14.5 16V7H12C11.4375 7 11 6.5625 11 6V3.5H6C5.71875 3.5 5.5 3.75 5.5 4V16C5.5 16.2812 5.71875 16.5 6 16.5H14ZM4 4C4 2.90625 4.875 2 6 2H11.1562C11.6875 2 12.1875 2.21875 12.5625 2.59375L15.4062 5.4375C15.7812 5.8125 16 6.3125 16 6.84375V16C16 17.125 15.0938 18 14 18H6C4.875 18 4 17.125 4 16V4ZM9 9.53125C9.25 9.46875 9.5 9.6875 9.5 9.96875V12.0312C9.5 12.2812 9.71875 12.5312 10 12.5312H12C12.25 12.5312 12.5 12.75 12.4375 13.0312C12.4375 13.0938 12.4062 13.1875 12.375 13.25C11.9688 14.8438 10.3125 15.8125 8.71875 15.375C7.125 14.9375 6.15625 13.3125 6.59375 11.6875C6.90625 10.5312 7.875 9.71875 8.96875 9.53125H9ZM10.9688 8.5625C12.25 8.75 13.2188 9.75 13.4375 11.0312C13.5 11.2812 13.25 11.5 13 11.5H11C10.7188 11.5 10.5 11.2812 10.5 11V9C10.5 8.75 10.7188 8.5 10.9688 8.5625Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Health Report</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'personalInfo' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12.5 6C12.5 5.125 12 4.3125 11.25 3.84375C10.4688 3.40625 9.5 3.40625 8.75 3.84375C7.96875 4.3125 7.5 5.125 7.5 6C7.5 6.90625 7.96875 7.71875 8.75 8.1875C9.5 8.625 10.4688 8.625 11.25 8.1875C12 7.71875 12.5 6.90625 12.5 6ZM6 6C6 4.59375 6.75 3.28125 8 2.5625C9.21875 1.84375 10.75 1.84375 12 2.5625C13.2188 3.28125 14 4.59375 14 6C14 7.4375 13.2188 8.75 12 9.46875C10.75 10.1875 9.21875 10.1875 8 9.46875C6.75 8.75 6 7.4375 6 6ZM4.53125 16.5H15.4375C15.1562 14.5312 13.4688 13 11.4062 13H8.5625C6.5 13 4.8125 14.5312 4.53125 16.5ZM3 17.0938C3 14 5.46875 11.5 8.5625 11.5H11.4062C14.5 11.5 17 14 17 17.0938C17 17.5938 16.5625 18 16.0625 18H3.90625C3.40625 18 3 17.5938 3 17.0938Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>My Profile</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'updatePassword' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M7.5 6V8H12.5V6C12.5 4.625 11.375 3.5 10 3.5C8.59375 3.5 7.5 4.625 7.5 6ZM6 8V6C6 3.8125 7.78125 2 10 2C12.1875 2 14 3.8125 14 6V8H15C16.0938 8 17 8.90625 17 10V16C17 17.125 16.0938 18 15 18H5C3.875 18 3 17.125 3 16V10C3 8.90625 3.875 8 5 8H6ZM4.5 10V16C4.5 16.2812 4.71875 16.5 5 16.5H15C15.25 16.5 15.5 16.2812 15.5 16V10C15.5 9.75 15.25 9.5 15 9.5H5C4.71875 9.5 4.5 9.75 4.5 10Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Change Password</span>
                    <ItemNav />
                </div>
                <div className={classes.typeTitle} style={{ borderTop: 0}}>Membership</div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'myPoints' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M7.5 4.75C7.5 4.78125 7.5 4.78125 7.5 4.8125C7.53125 4.84375 7.5625 4.90625 7.65625 4.96875C7.65625 5 7.6875 5 7.6875 5C7.09375 5.03125 6.53125 5.0625 6 5.15625V4.75C6 4.1875 6.28125 3.75 6.65625 3.4375C7 3.09375 7.46875 2.84375 8 2.65625C9.0625 2.25 10.4688 2 12 2C13.5 2 14.9062 2.25 15.9688 2.65625C16.5 2.84375 16.9688 3.09375 17.3125 3.4375C17.6875 3.75 18 4.1875 18 4.75V8V11.25C18 11.8125 17.6875 12.2812 17.3125 12.5938C16.9688 12.9062 16.5 13.1875 15.9688 13.375C15.6562 13.5 15.3438 13.5938 15 13.6875V12.125C15.1562 12.0625 15.2812 12.0312 15.4375 11.9688C15.8438 11.8125 16.1562 11.625 16.3125 11.4688C16.4062 11.4062 16.4375 11.3438 16.4688 11.3125C16.5 11.2812 16.5 11.25 16.5 11.25V9.90625C16.3125 9.96875 16.1562 10.0625 15.9688 10.125C15.6562 10.25 15.3438 10.3438 15 10.4375V8.875C15.1562 8.8125 15.2812 8.78125 15.4375 8.71875C15.8438 8.5625 16.1562 8.375 16.3125 8.21875C16.4062 8.15625 16.4375 8.09375 16.4688 8.0625C16.5 8.03125 16.5 8.03125 16.5 8V6.65625C16.3125 6.71875 16.1562 6.8125 15.9688 6.875C15.5312 7.03125 15.0625 7.1875 14.5312 7.28125C14.375 7.03125 14.1875 6.84375 14 6.6875C13.6875 6.40625 13.3125 6.15625 12.9375 5.96875C13.9375 5.90625 14.7812 5.71875 15.4375 5.46875C15.8438 5.3125 16.1562 5.125 16.3125 4.96875C16.4062 4.90625 16.4375 4.84375 16.4688 4.8125C16.5 4.78125 16.5 4.78125 16.5 4.75C16.5 4.75 16.5 4.75 16.4688 4.71875C16.4375 4.6875 16.4062 4.625 16.3125 4.53125C16.1562 4.375 15.8438 4.21875 15.4375 4.0625C14.5938 3.71875 13.375 3.5 12 3.5C10.5938 3.5 9.375 3.71875 8.53125 4.0625C8.125 4.21875 7.8125 4.375 7.65625 4.53125C7.5625 4.625 7.53125 4.6875 7.5 4.71875C7.5 4.75 7.5 4.75 7.5 4.75ZM3.5 8.75C3.5 8.78125 3.5 8.78125 3.5 8.8125C3.53125 8.84375 3.5625 8.90625 3.65625 8.96875C3.8125 9.125 4.125 9.3125 4.53125 9.46875C5.375 9.78125 6.59375 10 8 10C9.375 10 10.5938 9.78125 11.4375 9.46875C11.8438 9.3125 12.1562 9.125 12.3125 8.96875C12.4062 8.90625 12.4375 8.84375 12.4688 8.8125C12.4688 8.78125 12.5 8.78125 12.5 8.75C12.5 8.75 12.5 8.75 12.4688 8.71875C12.4375 8.6875 12.4062 8.625 12.3125 8.53125C12.1562 8.375 11.8438 8.21875 11.4375 8.0625C10.5938 7.71875 9.375 7.53125 8 7.53125C6.59375 7.53125 5.375 7.71875 4.53125 8.0625C4.125 8.21875 3.8125 8.40625 3.65625 8.53125C3.5625 8.625 3.53125 8.6875 3.5 8.71875C3.5 8.75 3.5 8.75 3.5 8.75ZM2 8.75C2 8.1875 2.28125 7.75 2.65625 7.4375C3 7.09375 3.46875 6.84375 4 6.65625C5.0625 6.25 6.46875 6 8 6C9.5 6 10.9062 6.25 11.9688 6.65625C12.5 6.84375 12.9688 7.09375 13.3125 7.4375C13.6875 7.75 14 8.1875 14 8.75V12V15.25C14 15.8125 13.6875 16.2812 13.3125 16.5938C12.9688 16.9062 12.5 17.1875 11.9688 17.375C10.9062 17.7812 9.5 18 8 18C6.46875 18 5.0625 17.7812 4 17.375C3.46875 17.1875 3 16.9375 2.65625 16.5938C2.28125 16.2812 2 15.8125 2 15.25V12V8.75ZM12.5 12V10.6562C12.3125 10.7188 12.1562 10.8125 11.9688 10.875C10.9062 11.2812 9.5 11.5 8 11.5C6.46875 11.5 5.0625 11.2812 4 10.875C3.8125 10.8125 3.65625 10.75 3.5 10.6562V12C3.5 12.0312 3.5 12.0312 3.5 12.0625C3.53125 12.0938 3.5625 12.1562 3.65625 12.2188C3.8125 12.375 4.125 12.5625 4.53125 12.7188C5.375 13.0312 6.59375 13.25 8 13.25C9.375 13.25 10.5938 13.0312 11.4375 12.7188C11.8438 12.5625 12.1562 12.375 12.3125 12.2188C12.4062 12.1562 12.4375 12.0938 12.4688 12.0625C12.4688 12.0312 12.5 12.0312 12.5 12ZM4 14.125C3.8125 14.0625 3.65625 14 3.5 13.9062V15.25C3.5 15.25 3.5 15.2812 3.5 15.3125C3.53125 15.3438 3.5625 15.4062 3.65625 15.4688C3.8125 15.625 4.125 15.8125 4.53125 15.9688C5.375 16.2812 6.59375 16.5 8 16.5C9.375 16.5 10.5938 16.2812 11.4375 15.9688C11.8438 15.8125 12.1562 15.625 12.3125 15.4688C12.4062 15.4062 12.4375 15.3438 12.4688 15.3125C12.5 15.2812 12.5 15.25 12.5 15.25V13.9062C12.3125 13.9688 12.1562 14.0625 11.9688 14.125C10.9062 14.5312 9.5 14.75 8 14.75C6.46875 14.75 5.0625 14.5312 4 14.125Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Point History</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push('/membership-benefit');
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2.25 8.25C1.85218 8.25 1.47064 8.09196 1.18934 7.81066C0.908035 7.52936 0.75 7.14782 0.75 6.75V4.5L4.0575 1.1925C4.19704 1.05212 4.36299 0.940754 4.54577 0.864808C4.72856 0.788863 4.92457 0.749844 5.1225 0.75H11.3775C11.5754 0.749844 11.7714 0.788863 11.9542 0.864808C12.137 0.940754 12.303 1.05212 12.4425 1.1925L15.75 4.5V6.75C15.75 7.14782 15.592 7.52936 15.3107 7.81066C15.0294 8.09196 14.6478 8.25 14.25 8.25M0.75 4.5H15.75M2.25 8.25V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H12.75C13.1478 15.75 13.5294 15.592 13.8107 15.3107C14.092 15.0294 14.25 14.6478 14.25 14.25V8.25M2.25 8.25C2.6882 8.22588 3.1067 8.06006 3.4425 7.7775C3.53199 7.71283 3.63959 7.67802 3.75 7.67802C3.86041 7.67802 3.96801 7.71283 4.0575 7.7775C4.3933 8.06006 4.8118 8.22588 5.25 8.25C5.6882 8.22588 6.1067 8.06006 6.4425 7.7775C6.53199 7.71283 6.63959 7.67802 6.75 7.67802C6.86041 7.67802 6.96801 7.71283 7.0575 7.7775C7.3933 8.06006 7.8118 8.22588 8.25 8.25C8.6882 8.22588 9.1067 8.06006 9.4425 7.7775C9.53199 7.71283 9.63959 7.67802 9.75 7.67802C9.86041 7.67802 9.96801 7.71283 10.0575 7.7775C10.3933 8.06006 10.8118 8.22588 11.25 8.25C11.6882 8.22588 12.1067 8.06006 12.4425 7.7775C12.532 7.71283 12.6396 7.67802 12.75 7.67802C12.8604 7.67802 12.968 7.71283 13.0575 7.7775C13.3933 8.06006 13.8118 8.22588 14.25 8.25M10.5 15.75V12.75C10.5 12.3522 10.342 11.9706 10.0607 11.6893C9.77936 11.408 9.39782 11.25 9 11.25H7.5C7.10218 11.25 6.72064 11.408 6.43934 11.6893C6.15804 11.9706 6 12.3522 6 12.75V15.75" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                        />
                    </svg>
                    <span>Membership Benefit</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push('/catalog');
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M3.61328 13.9385C4.13951 13.9387 4.58398 14.3798 4.58398 14.9043V16.6348C4.5839 17.1979 4.13671 17.5994 3.61328 17.5996H1.87109C1.30846 17.5996 0.900464 17.1953 0.900391 16.6348V14.9043C0.900391 14.3825 1.30569 13.9385 1.87109 13.9385H3.61328ZM18.1289 14.8037C18.6553 14.8037 19.0996 15.2449 19.0996 15.7695C19.0995 16.3327 18.6524 16.7344 18.1289 16.7344H7.09668C6.53414 16.7343 6.12612 16.33 6.12598 15.7695C6.12598 15.2477 6.53132 14.8038 7.09668 14.8037H18.1289ZM3.61328 8.16895C4.13951 8.16916 4.58398 8.61031 4.58398 9.13477V10.8652C4.58398 11.4284 4.13675 11.8309 3.61328 11.8311H1.87109C1.30841 11.8311 0.900391 11.4259 0.900391 10.8652V9.13477C0.900391 8.61293 1.30569 8.16895 1.87109 8.16895H3.61328ZM18.1289 9.03418C18.6553 9.03418 19.0996 9.47542 19.0996 10C19.0996 10.5633 18.6525 10.9658 18.1289 10.9658H7.09668C6.53404 10.9658 6.12598 10.5606 6.12598 10C6.12598 9.47819 6.53132 9.03423 7.09668 9.03418H18.1289ZM3.61328 2.40039C4.13946 2.4006 4.5839 2.84084 4.58398 3.36523V5.0957C4.58398 5.65891 4.13675 6.06133 3.61328 6.06152H1.87109C1.30841 6.06152 0.900391 5.65634 0.900391 5.0957V3.36523C0.900468 2.84346 1.30574 2.40039 1.87109 2.40039H3.61328ZM18.1289 3.19824C18.3984 3.19824 18.6417 3.33048 18.8154 3.52148C18.9889 3.71225 19.0995 3.96861 19.0996 4.23047C19.0996 4.79381 18.6525 5.19629 18.1289 5.19629H7.09668C6.53404 5.19624 6.12598 4.79108 6.12598 4.23047C6.12613 3.71861 6.52227 3.1983 7.09668 3.19824H18.1289Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>E-Catalogue</span>
                    <ItemNav />
                </div>
                <div className={classes.typeTitle} style={{ borderTop: 0}}>Help Center</div>
                <div className={classes.accountLink} onClick={() => {
                    history.push('/contact');
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M7.5 4.75C7.5 4.78125 7.5 4.78125 7.5 4.8125C7.53125 4.84375 7.5625 4.90625 7.65625 4.96875C7.65625 5 7.6875 5 7.6875 5C7.09375 5.03125 6.53125 5.0625 6 5.15625V4.75C6 4.1875 6.28125 3.75 6.65625 3.4375C7 3.09375 7.46875 2.84375 8 2.65625C9.0625 2.25 10.4688 2 12 2C13.5 2 14.9062 2.25 15.9688 2.65625C16.5 2.84375 16.9688 3.09375 17.3125 3.4375C17.6875 3.75 18 4.1875 18 4.75V8V11.25C18 11.8125 17.6875 12.2812 17.3125 12.5938C16.9688 12.9062 16.5 13.1875 15.9688 13.375C15.6562 13.5 15.3438 13.5938 15 13.6875V12.125C15.1562 12.0625 15.2812 12.0312 15.4375 11.9688C15.8438 11.8125 16.1562 11.625 16.3125 11.4688C16.4062 11.4062 16.4375 11.3438 16.4688 11.3125C16.5 11.2812 16.5 11.25 16.5 11.25V9.90625C16.3125 9.96875 16.1562 10.0625 15.9688 10.125C15.6562 10.25 15.3438 10.3438 15 10.4375V8.875C15.1562 8.8125 15.2812 8.78125 15.4375 8.71875C15.8438 8.5625 16.1562 8.375 16.3125 8.21875C16.4062 8.15625 16.4375 8.09375 16.4688 8.0625C16.5 8.03125 16.5 8.03125 16.5 8V6.65625C16.3125 6.71875 16.1562 6.8125 15.9688 6.875C15.5312 7.03125 15.0625 7.1875 14.5312 7.28125C14.375 7.03125 14.1875 6.84375 14 6.6875C13.6875 6.40625 13.3125 6.15625 12.9375 5.96875C13.9375 5.90625 14.7812 5.71875 15.4375 5.46875C15.8438 5.3125 16.1562 5.125 16.3125 4.96875C16.4062 4.90625 16.4375 4.84375 16.4688 4.8125C16.5 4.78125 16.5 4.78125 16.5 4.75C16.5 4.75 16.5 4.75 16.4688 4.71875C16.4375 4.6875 16.4062 4.625 16.3125 4.53125C16.1562 4.375 15.8438 4.21875 15.4375 4.0625C14.5938 3.71875 13.375 3.5 12 3.5C10.5938 3.5 9.375 3.71875 8.53125 4.0625C8.125 4.21875 7.8125 4.375 7.65625 4.53125C7.5625 4.625 7.53125 4.6875 7.5 4.71875C7.5 4.75 7.5 4.75 7.5 4.75ZM3.5 8.75C3.5 8.78125 3.5 8.78125 3.5 8.8125C3.53125 8.84375 3.5625 8.90625 3.65625 8.96875C3.8125 9.125 4.125 9.3125 4.53125 9.46875C5.375 9.78125 6.59375 10 8 10C9.375 10 10.5938 9.78125 11.4375 9.46875C11.8438 9.3125 12.1562 9.125 12.3125 8.96875C12.4062 8.90625 12.4375 8.84375 12.4688 8.8125C12.4688 8.78125 12.5 8.78125 12.5 8.75C12.5 8.75 12.5 8.75 12.4688 8.71875C12.4375 8.6875 12.4062 8.625 12.3125 8.53125C12.1562 8.375 11.8438 8.21875 11.4375 8.0625C10.5938 7.71875 9.375 7.53125 8 7.53125C6.59375 7.53125 5.375 7.71875 4.53125 8.0625C4.125 8.21875 3.8125 8.40625 3.65625 8.53125C3.5625 8.625 3.53125 8.6875 3.5 8.71875C3.5 8.75 3.5 8.75 3.5 8.75ZM2 8.75C2 8.1875 2.28125 7.75 2.65625 7.4375C3 7.09375 3.46875 6.84375 4 6.65625C5.0625 6.25 6.46875 6 8 6C9.5 6 10.9062 6.25 11.9688 6.65625C12.5 6.84375 12.9688 7.09375 13.3125 7.4375C13.6875 7.75 14 8.1875 14 8.75V12V15.25C14 15.8125 13.6875 16.2812 13.3125 16.5938C12.9688 16.9062 12.5 17.1875 11.9688 17.375C10.9062 17.7812 9.5 18 8 18C6.46875 18 5.0625 17.7812 4 17.375C3.46875 17.1875 3 16.9375 2.65625 16.5938C2.28125 16.2812 2 15.8125 2 15.25V12V8.75ZM12.5 12V10.6562C12.3125 10.7188 12.1562 10.8125 11.9688 10.875C10.9062 11.2812 9.5 11.5 8 11.5C6.46875 11.5 5.0625 11.2812 4 10.875C3.8125 10.8125 3.65625 10.75 3.5 10.6562V12C3.5 12.0312 3.5 12.0312 3.5 12.0625C3.53125 12.0938 3.5625 12.1562 3.65625 12.2188C3.8125 12.375 4.125 12.5625 4.53125 12.7188C5.375 13.0312 6.59375 13.25 8 13.25C9.375 13.25 10.5938 13.0312 11.4375 12.7188C11.8438 12.5625 12.1562 12.375 12.3125 12.2188C12.4062 12.1562 12.4375 12.0938 12.4688 12.0625C12.4688 12.0312 12.5 12.0312 12.5 12ZM4 14.125C3.8125 14.0625 3.65625 14 3.5 13.9062V15.25C3.5 15.25 3.5 15.2812 3.5 15.3125C3.53125 15.3438 3.5625 15.4062 3.65625 15.4688C3.8125 15.625 4.125 15.8125 4.53125 15.9688C5.375 16.2812 6.59375 16.5 8 16.5C9.375 16.5 10.5938 16.2812 11.4375 15.9688C11.8438 15.8125 12.1562 15.625 12.3125 15.4688C12.4062 15.4062 12.4375 15.3438 12.4688 15.3125C12.5 15.2812 12.5 15.25 12.5 15.25V13.9062C12.3125 13.9688 12.1562 14.0625 11.9688 14.125C10.9062 14.5312 9.5 14.75 8 14.75C6.46875 14.75 5.0625 14.5312 4 14.125Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Contact Us</span>
                    <ItemNav />
                </div>
                {/* <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'notification' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M10 2C10.5312 2 11 2.46875 11 3V3.625C13.2812 4.0625 15 6.09375 15 8.5V9.3125C15 10.7188 15.4688 12.0938 16.3438 13.2188L16.8125 13.7812C17 14.0312 17.0312 14.3438 16.9062 14.5938C16.7812 14.8438 16.5312 15 16.25 15H3.75C3.4375 15 3.1875 14.8438 3.0625 14.5938C2.9375 14.3438 2.96875 14.0312 3.15625 13.7812L3.625 13.2188C4.5 12.0938 5 10.7188 5 9.3125V8.5C5 6.09375 6.71875 4.0625 9 3.625V3C9 2.46875 9.4375 2 10 2ZM10 5C8.0625 5 6.5 6.59375 6.5 8.5V9.3125C6.5 10.8125 6.0625 12.25 5.25 13.5H14.7188C13.9062 12.25 13.5 10.8125 13.5 9.3125V8.5C13.5 6.59375 11.9062 5 10 5ZM12 16C12 16.5312 11.7812 17.0625 11.4062 17.4375C11.0312 17.8125 10.5312 18 10 18C9.46875 18 8.9375 17.8125 8.5625 17.4375C8.1875 17.0625 8 16.5312 8 16H10H12Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Notification</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'newsLetter' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M4 5.5C3.71875 5.5 3.5 5.75 3.5 6V6.71875L8.875 11.125C9.53125 11.6562 10.4375 11.6562 11.0938 11.125L16.5 6.71875V6C16.5 5.75 16.25 5.5 16 5.5H4ZM3.5 8.65625V14C3.5 14.2812 3.71875 14.5 4 14.5H16C16.25 14.5 16.5 14.2812 16.5 14V8.65625L12.0625 12.2812C10.8438 13.2812 9.125 13.2812 7.9375 12.2812L3.5 8.65625ZM2 6C2 4.90625 2.875 4 4 4H16C17.0938 4 18 4.90625 18 6V14C18 15.125 17.0938 16 16 16H4C2.875 16 2 15.125 2 14V6Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Newsletter</span>
                    <ItemNav />
                </div>
                <div className={classes.accountLink} onClick={() => {
                    history.push({
                        pathname: '/my-account-information',
                        state: { tabId: 'referAFriend' }
                    });
                }}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M17 6C17 7.65625 15.6562 9 14 9C13.0938 9 12.2812 8.625 11.7188 7.96875L8.90625 9.375C8.96875 9.59375 9 9.8125 9 10C9 10.2188 8.96875 10.4375 8.90625 10.6562L11.7188 12.0312C12.2812 11.4062 13.0938 11 14 11C15.6562 11 17 12.3438 17 14C17 15.6562 15.6562 17 14 17C12.3438 17 11 15.6562 11 14C11 13.8125 11 13.5938 11.0625 13.375L8.25 11.9688C7.6875 12.625 6.875 13 6 13C4.34375 13 3 11.6562 3 10C3 8.34375 4.34375 7 6 7C6.875 7 7.6875 7.40625 8.25 8.03125L11.0625 6.65625C11 6.4375 11 6.21875 11 6C11 4.34375 12.3438 3 14 3C15.6562 3 17 4.34375 17 6ZM6 11.5C6.53125 11.5 7 11.2188 7.28125 10.75C7.5625 10.3125 7.5625 9.71875 7.28125 9.25C7 8.8125 6.53125 8.5 6 8.5C5.4375 8.5 4.96875 8.8125 4.6875 9.25C4.40625 9.71875 4.40625 10.3125 4.6875 10.75C4.96875 11.2188 5.4375 11.5 6 11.5ZM15.5 6C15.5 5.46875 15.1875 5 14.75 4.71875C14.2812 4.4375 13.6875 4.4375 13.25 4.71875C12.7812 5 12.5 5.46875 12.5 6C12.5 6.5625 12.7812 7.03125 13.25 7.3125C13.6875 7.59375 14.2812 7.59375 14.75 7.3125C15.1875 7.03125 15.5 6.5625 15.5 6ZM14 15.5C14.5312 15.5 15 15.2188 15.2812 14.75C15.5625 14.3125 15.5625 13.7188 15.2812 13.25C15 12.8125 14.5312 12.5 14 12.5C13.4375 12.5 12.9688 12.8125 12.6875 13.25C12.4062 13.7188 12.4062 14.3125 12.6875 14.75C12.9688 15.2188 13.4375 15.5 14 15.5Z"
                            fill='#212121'
                        />
                    </svg>
                    <span>Refer a Friend</span>
                    <ItemNav />
                </div> */}
                <div onClick={() => {
                    userContext[1].signOut({ revokeToken, explicit: true });
                    history.push('/sign-in');
                }} className={classes.accountLink} style={{ cursor: 'pointer' }}>
                    <svg
                        width="15"
                        height="11"
                        viewBox="0 0 15 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2.71552 -8.34465e-06H5.09159C5.31789 -8.34465e-06 5.43103 0.113138 5.43103 0.339431V1.01831C5.43103 1.2446 5.31789 1.35775 5.09159 1.35775H2.71552C2.33836 1.35775 2.01778 1.48975 1.75377 1.75376C1.48976 2.01777 1.35776 2.33835 1.35776 2.71551V8.14654C1.35776 8.5237 1.48976 8.84428 1.75377 9.10829C2.01778 9.3723 2.33836 9.5043 2.71552 9.5043H5.09159C5.31789 9.5043 5.43103 9.61745 5.43103 9.84374V10.5226C5.43103 10.7489 5.31789 10.8621 5.09159 10.8621H2.71552C1.96121 10.8621 1.32004 10.5981 0.792026 10.07C0.264009 9.54202 0 8.90085 0 8.14654V2.71551C0 1.9612 0.264009 1.32003 0.792026 0.792018C1.32004 0.264 1.96121 -8.34465e-06 2.71552 -8.34465e-06ZM9.24973 0.565724C9.41945 0.396005 9.57974 0.386576 9.7306 0.537438L14.3696 5.17645C14.5393 5.34617 14.5393 5.50646 14.3696 5.65732L9.7306 10.2963C9.57974 10.466 9.41945 10.466 9.24973 10.2963L8.71228 9.75888C8.54256 9.58916 8.54256 9.42887 8.71228 9.27801L11.9087 6.16648H4.8653C4.63901 6.16648 4.52586 6.05333 4.52586 5.82704V5.03501C4.52586 4.80872 4.63901 4.69557 4.8653 4.69557H11.9087L8.71228 1.58404C8.54256 1.43318 8.54256 1.27289 8.71228 1.10317L9.24973 0.565724Z"
                            fill="#757575"
                        />
                    </svg>
                    <span style={{ color: '#757575'}}>Logout</span>
                </div>
            </div>

            <div
                className="hidden-desktop"
                style={{
                    padding: '5rem 3rem 2.5rem 3rem',
                    backgroundColor: '#FFFFFF',
                    display: 'none'
                }}
            >
                <div className={classes.wishlistInfo}>
                    <p className={classes.wishlistInfoTitle}>
                        <FormattedMessage
                            id={'accountSetting.wishlist'}
                            defaultMessage={'Wishlist'}
                        />
                    </p>
                    <Link to="/wishlist" className={classes.wishlistInfoLink}>
                        <FormattedMessage
                            id={'accountSetting.viewAll'}
                            defaultMessage={'View All'}
                        />
                    </Link>
                </div>
                {wishListContent}
            </div>

            <div
                className="hidden-desktop"
                style={{ display: 'flex', justifyContent: 'center', display: 'none' }}
            >
                <button
                    className={classes.signoutButton}
                    onClick={() => userContext[1].signOut({ revokeToken, explicit: true })}
                >
                    <FormattedMessage
                        id={'accountSetting.signOut'}
                        defaultMessage={'Keluar'}
                    />
                </button>
            </div>

            <div className={classes.desktopMenu} id="accountDom">
                <section
                    style={{ marginTop: '65px', marginBottom: '86px' }}
                    className="d-flex align-items-center justify-content-center"
                >
                    <Tabs headers={TabTitle} cssClasses={[classes.tabContent]} classes={{ selected: defaultClasses.selected }}>
                        {/* <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Daftar Kesehatan"
                        >
                            <div className={classes.tabContent} style={{minHeight: 100}}>
                                {initialValues.customer.is_register_test === 1 ? (
                                    <MedicalPage />
                                ) : (
                                    <button
                                        className={`${classes.accountLink} free`}
                                        onClick={() => {
                                            setIsOpen(true);
                                        }}
                                        style={{margin: '0 auto'}}
                                    >
                                        <span>Daftar Check Kesehatan</span>
                                    </button>
                                )}
                            </div>
                        </TabItem> */}

                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Pesanan Saya"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.myOrder'}
                                        defaultMessage={'My Orders'}
                                    />
                                </h3>
                                <AccountOrderHistory />
                            </div>
                        </TabItem>

                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Notification"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.notification'}
                                        defaultMessage={'Notification'}
                                    />
                                </h3>
                                <NotifitionInfo />
                            </div>
                        </TabItem>

                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Informasi Akun"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.accountInformation'}
                                        defaultMessage={'Account Information'}
                                    />
                                </h3>
                                {editForm}
                            </div>
                        </TabItem>

                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="healthList"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.healthList'}
                                        defaultMessage={'Laporan Kesahatan'}
                                    />
                                </h3>
                                <HealthList />
                            </div>
                        </TabItem>

                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Daftar Alamat"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.addressBook'}
                                        defaultMessage={'Address Book'}
                                    />
                                </h3>
                                <AddressInfo />
                            </div>
                        </TabItem>
                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Pengaturan"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.setting'}
                                        defaultMessage={'Setting'}
                                    />
                                </h3>
                                <AccountSetting />
                                <div>
                                    <button
                                        className={classes.logOutDesktop}
                                        onClick={() => userContext[1].signOut({ revokeToken, explicit: true })}
                                    >
                                        <FormattedMessage
                                            id={'accountSetting.logout'}
                                            defaultMessage={'Logout'}
                                        />
                                    </button>
                                </div>
                            </div>
                        </TabItem>
                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="Whislist"
                        >
                            <div className={classes.tabContent}>
                                <div className={classes.wishlistInfo}>
                                    <h3 className={classes.wishListTabTitle}>
                                        <FormattedMessage
                                            id={'accountSetting.wishlist'}
                                            defaultMessage={'Wishlist'}
                                        />
                                    </h3>
                                    <Link
                                        to="/wishlist"
                                        className={classes.wishlistInfoLink}
                                    >
                                        <FormattedMessage
                                            id={'accountSetting.viewAll'}
                                            defaultMessage={'View All'}
                                        />
                                    </Link>
                                </div>
                                {wishListContent}
                            </div>
                        </TabItem>
                        <TabItem
                            cssClasses={[classes.tabItem]}
                            tabName="My Coupon"
                        >
                            <div className={classes.tabContent}>
                                <h3 className={classes.tabContentTitle}>
                                    <FormattedMessage
                                        id={'accountSetting.myCoupon'}
                                        defaultMessage={'Coupon'}
                                    />
                                </h3>
                                <MyCouponList />
                            </div>
                        </TabItem>
                    </Tabs>
                </section>
            </div>

            {/* <div className="customerAccountFooter hidden-desktop">
                <CmsBlock identifiers={['footer_links_block']} />
            </div> */}

            <ModalMedical
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                handleRegisterMedical={handleRegisterMedical}
            />
        </>
    );
};

export default AccountInformationPage;
