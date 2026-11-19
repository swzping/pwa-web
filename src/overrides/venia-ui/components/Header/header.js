import React, { Fragment, useState, useEffect } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { ChevronDown, Heart as HeartIcon } from 'react-feather';
import { shape, string } from 'prop-types';

import Logo from '@magento/venia-ui/lib/components/Logo';
// import AccountTrigger from '@magento/venia-ui/lib/components/Header/accountTrigger';
// import CartTrigger from '@magento/venia-ui/lib/components/Header/cartTrigger';
// import NavTrigger from "@magento/venia-ui/lib/components/Header/navTrigger";
import AccountTrigger from './accountTrigger';
import CartTrigger from './cartTrigger';
import MobileCart from './mobileCart';
import OnlineIndicator from '@magento/venia-ui/lib/components/Header/onlineIndicator';
import { useHeader } from '@magento/peregrine/lib/talons/Header/useHeader';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import { useWindowSize } from '@magento/peregrine';
import { useRefreshNotification } from '@/helpers/hooks';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/Header/header.module.css';
import Icon from '@magento/venia-ui/lib/components/Icon';
import PageLoadingIndicator from '@magento/venia-ui/lib/components/PageLoadingIndicator';
// import StoreSwitcher from '@magento/venia-ui/lib/components/Header/storeSwitcher';
import MegaMenu from '@magento/venia-ui/lib/components/MegaMenu';
import SearchBar from '@magento/venia-ui/lib/components/SearchBar';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';
// import LanguageSwitcher from '../../../../modules/swift-pwa-ui/components/Header/languageSwitcher';
import VesMenu from '../../../../modules/swift-pwa-ui/components/VesMenu';
import { LocationPinOutlined, HeartOutlined, DownloadAppOutlined, CloseOutline, LocationPinOutlinedYellow,HeartOutlinedYellow, NotifitionOutlined, NotifitionOutlinedYellow} from '@/assets/icons'
// import CurrencySwitcher from '@magento/venia-ui/lib/components/Header/currencySwitcher';
// import Image from '@magento/venia-ui/lib/components/Image';
// import CompareButton from '../../../../modules/swift-pwa-ui/components/Compare/IconBadgeButton';

// custom styles
import styles from './index.module.css';
import { useLazyQuery } from '@apollo/client';
import { GET_NOTIFITION_LIST, GET_NOTIFITION_COUNT } from '../../../../modules/custom-modules/components/CustomAccountInformation/notifition.gpl.js';
import { GET_HEALTHCHECKS } from '../../../../modules/custom-modules/components/CustomAccountInformation/health.gpl';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useQuery } from '@apollo/client';

const CaretDownIcon = (
    <Icon classes={{ icon: defaultClasses.icon }} src={ChevronDown} size={12} />
);

const Header = props => {
    const {
        currentUrlLogo,
        hasBeenOffline,
        isOnline,
        isSearchOpen,
        searchRef
    } = useHeader();
    const classes = useStyle(defaultClasses, props.classes);
    const rootClass = isSearchOpen ? classes.open : classes.closed;
    const location = useLocation();
    const [ downLoadShow, setDownLoadShow ] = useState(false);
    // const modified_currentUrlLogo = currentUrlLogo?.replace("graphql", "");
    const modified_currentUrlLogo = '';
    const [{ isSignedIn: isUserSignedIn }] = useUserContext();
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    const [isHealthVis, setIsHealthVis] = useState(true)
    const history = useHistory();

    const { data: queryResponse, refetch: refetchNotificationCount } = useQuery(GET_NOTIFITION_COUNT, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    const notificationCount =  queryResponse?.getNotifications?.total_unread
    // 自动监听刷新事件
    useRefreshNotification(refetchNotificationCount);

    const menuComponent = !!process.env.VESMENU_ENABLE ? (
        <VesMenu />
    ) : (
        <MegaMenu />
    );

    const logoProps = isMobile ? {
        height: 24,
        width: 103
    } : {
        height: 32,
        width: 134
    }

    if (location.pathname === '/checkout') {
        return (
            <nav
                // class="navbar navbar-light"
                className={classes.navbar}
                style={{ backgroundColor: '#FF8200' }}
            >
                <div className={classes.container}>
                    <Link to={'/'} className="navbar-brand">
                        <Logo
                            classes={{ logo: classes.logo }}
                            logoUrl={modified_currentUrlLogo}
                            {...logoProps}
                        />
                    </Link>
                </div>
            </nav>
        );
    } else {
        return (
            <Fragment>
                <div className={classes.bannerWrapper}>
                    <CmsBlock identifiers={['hello-banner']} />
                </div>
                <header className={rootClass}>
                    { isMobile && isHealthVis && <div style={{ display: 'none' }} className="health">
                        <div style={{ display: 'flex' }}>
                            <svg
                                width="19"
                                height="18"
                                viewBox="0 0 19 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M9.42188 18C6.1875 18 3.23438 16.3125 1.61719 13.5C0 10.7227 0 7.3125 1.61719 4.5C3.23438 1.72266 6.1875 0 9.42188 0C12.6211 0 15.5742 1.72266 17.1914 4.5C18.8086 7.3125 18.8086 10.7227 17.1914 13.5C15.5742 16.3125 12.6211 18 9.42188 18ZM8.01562 11.8125C7.52344 11.8125 7.17188 12.1992 7.17188 12.6562C7.17188 13.1484 7.52344 13.5 8.01562 13.5H10.8281C11.2852 13.5 11.6719 13.1484 11.6719 12.6562C11.6719 12.1992 11.2852 11.8125 10.8281 11.8125H10.5469V8.71875C10.5469 8.26172 10.1602 7.875 9.70312 7.875H8.01562C7.52344 7.875 7.17188 8.26172 7.17188 8.71875C7.17188 9.21094 7.52344 9.5625 8.01562 9.5625H8.85938V11.8125H8.01562ZM9.42188 4.5C8.78906 4.5 8.29688 5.02734 8.29688 5.625C8.29688 6.25781 8.78906 6.75 9.42188 6.75C10.0195 6.75 10.5469 6.25781 10.5469 5.625C10.5469 5.02734 10.0195 4.5 9.42188 4.5Z"
                                    fill="white"
                                />
                            </svg>
                            <div
                                style={{
                                    marginLeft: 6,
                                    marginTop: -7
                                }}
                            >
                                <span>Your Laporan Kesahatan is ready!</span>
                                <Link
                                    style={{
                                        display: 'block',
                                        cursor: 'pointer'
                                    }}
                                    to={resourceUrl('/account-information')}
                                    onClick={() => {
                                        localStorage.setItem('accountTab', 2)
                                    }}
                                >
                                    Check it now
                                </Link>
                            </div>
                        </div>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setIsHealthVis(false)
                            }}
                        >
                            <path
                                d="M11.1094 1.51172L6.89062 5.73047L11.0742 9.91406C11.4258 10.2305 11.4258 10.7578 11.0742 11.0742C10.7578 11.4258 10.2305 11.4258 9.91406 11.0742L5.69531 6.89062L1.51172 11.0742C1.19531 11.4258 0.667969 11.4258 0.351562 11.0742C0 10.7578 0 10.2305 0.351562 9.87891L4.53516 5.69531L0.351562 1.51172C0 1.19531 0 0.667969 0.351562 0.316406C0.667969 0 1.19531 0 1.54688 0.316406L5.73047 4.53516L9.91406 0.351562C10.2305 0 10.7578 0 11.1094 0.351562C11.4258 0.667969 11.4258 1.19531 11.1094 1.51172Z"
                                fill="white"
                            />
                        </svg>
                    </div>}
                    <div className={`${styles.headerContainer}`}>
                        <div
                            className={`${classes.toolbar} ${styles.header} ${styles.header_mobile
                                }`}
                        >
                            {/*
                            <div className={classes.primaryActions}>
                                <NavTrigger />
                            </div>
                        */}
                            <OnlineIndicator
                                hasBeenOffline={hasBeenOffline}
                                isOnline={isOnline}
                            />
                            <div>
                                <Link
                                    to={'/'}
                                    className={classes.logoContainer}
                                >
                                    <Logo
                                        classes={{ logo: classes.logo }}
                                        logoUrl={modified_currentUrlLogo}
                                        {...logoProps}
                                    />
                                </Link>
                            </div>
                            <div
                                className={`${styles.searchBar} hidden-mobile`}
                            >
                                <SearchBar isOpen={false} ref={searchRef} />
                            </div>
                            <div
                                className={`${classes.secondaryActions} ${styles.secondaryActions
                                    }`}
                            >
                                <div className={styles.actionsTop}>
                                    {/* <StoreSwitcher /> */}
                                    { !isMobile ? <div
                                        className={`${styles.headerIcon} ${styles.downloadWrapper}`}
                                    >
                                        <DownloadAppOutlined className={styles.svgIcon} />
                                        <div className={styles.iconText} onClick={() => setDownLoadShow(!downLoadShow)}>Download App</div>
                                        {downLoadShow ? <div className={styles.downloadPop}>
                                            <img src="https://guardianindonesia.co.id//media/wysiwyg/footer/footer_code.png" alt="" width="80" height="80"/>
                                            <div>
                                                <a href="https://play.google.com/store/apps/details?id=id.app.guardian">
                                                    <img style={{ marginBottom: '4px' }} src="https://guardianindonesia.co.id//media/wysiwyg/footer/footer_googleplay.png" alt="" width="116" height="38" />
                                                </a>
                                                <a href="https://apps.apple.com/id/app/guardian-id/id1623324002">
                                                    <img src="https://guardianindonesia.co.id//media/wysiwyg/footer/footer_appstore.png" alt="" width="116" height="38" />
                                                </a>
                                            </div>
                                            <CloseOutline className={styles.closeIcon}  onClick={() => setDownLoadShow(false)} />
                                        </div> : null}
                                    </div> : null }
                                    <Link
                                        to={resourceUrl('/store-locator')}
                                        className={styles.headerIcon}
                                    >
                                        {!isMobile?<LocationPinOutlined className={styles.svgIcon}/>:<LocationPinOutlinedYellow style={{withh: '28px', height: '28px'}} />}
                                        { !isMobile ? <div className={styles.iconText}>Store Location</div> : null }
                                    </Link>
                                    <Link
                                        to={resourceUrl('/wishlist')}
                                        className={styles.headerIcon}
                                    >
                                        {!isMobile?<HeartOutlined className={styles.svgIcon}/>:<HeartOutlinedYellow style={{withh: '28px', height: '28px'}} />}
                                        { !isMobile ? <span className={styles.iconText}>Wishlist</span> : null }
                                    </Link>
                                    { isUserSignedIn && <div
                                        // to={resourceUrl('/account-information')}
                                        className={styles.headerIcon}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            localStorage.setItem('accountTab', 1)
                                            history.push('/notification-info');
                                        }}
                                    >
                                        {!isMobile?<NotifitionOutlined className={styles.svgIcon}/>:<NotifitionOutlinedYellow style={{withh: '28px', height: '28px'}} />}
                                        {!!notificationCount && <div className={`${styles.notificationCount} ${notificationCount < 100 ? '' : styles.notificationCountLarge}`} >
                                            {notificationCount > 99 ? `99+` : `${notificationCount}` }
                                        </div>}
                                        { !isMobile ? <span className={styles.iconText} style={{ marginLeft: 10 }}>Notification</span> : null }
                                    </div>}
                                    { isMobile ? <MobileCart /> : null }
                                </div>
                                { !isMobile ? <div className={styles.actionsBottom}>
                                    <AccountTrigger />
                                    <CartTrigger />
                                    {/* <LanguageSwitcher /> */}
                                </div> : null }
                            </div>
                        </div>
                    </div>
                    <div className={`${styles.searchMobile} hidden-desktop`}>
                        <div className={styles.searchBar}>
                            <SearchBar isOpen={false} ref={searchRef} />
                        </div>
                    </div>
                    <div className={`${styles.megaMenu} hidden-mobile`}>
                        {menuComponent}
                    </div>
                    {/* <PageLoadingIndicator /> */}
                </header>
            </Fragment>
        );
    }
};

Header.propTypes = {
    classes: shape({
        closed: string,
        logo: string,
        open: string,
        primaryActions: string,
        secondaryActions: string,
        toolbar: string,
        switchers: string,
        switchersContainer: string
    })
};

export default Header;
