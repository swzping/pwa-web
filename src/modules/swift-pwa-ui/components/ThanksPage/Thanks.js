import React, { useCallback, useMemo, useEffect, useContext } from 'react';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { useLocation, useHistory } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { getSearchParam } from '@magento/peregrine/lib/hooks/useSearchParam';
import defaultClasses from './thanks.module.css';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import { useThankPage } from '../../../peregrine/talons/ThanksPage/useThankPage';
import FailedPage from './components/failedPage';
import { saveCartId } from '@magento/peregrine/lib/store/actions/cart/asyncActions';

const ThanksPage = () => {
    const classes = useStyle(defaultClasses);
    const location = useLocation();
    const history = useHistory();
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, []);

    const orderNumber = useMemo(() => {
        return getSearchParam('number', location);
    }, [getSearchParam, location]);

    const paymentStatus = useMemo(() => {
        return getSearchParam('status', location);
    }, [getSearchParam, location]);

    const handleLinkClick = useCallback(() => {
        history.push('/');
    }, [history]);

    useEffect(() => {
        if (!orderNumber) {
            history.push('/');
        }
    }, []);

    const talonProps = useThankPage({
        orderNumber
    });

    const {
        orderData,
        shouldShowLoadingIndicator,
        handleReorder,
        snapStatus
    } = talonProps;

    useEffect(() => {
        const orderStatus = snapStatus?.data?.getSnapOrderStatusByOrderId;
        if (!orderStatus) return;
        const { cart_id, reorder_status } = orderStatus;
        if (!cart_id || !reorder_status) return;
        saveCartId(cart_id);
        const timer = setTimeout(() => {
            history.push('/cart');
        }, 2000);
        return () => clearTimeout(timer);
    }, [snapStatus, history]);

    if (shouldShowLoadingIndicator) {
        return (
            <div className={classes.root}>
                <div className={classes.wrapper}>
                    <div className={classes.iconWrapper}>
                        <Shimmer width="100px" height="100px" />
                    </div>
                    <div className="mb-3">
                        <Shimmer width="250px" height="30px" />
                    </div>
                    <div className="mb-3">
                        <Shimmer width="400px" height="20px" />
                    </div>
                    <div>
                        <Shimmer width="300px" height="50px" />
                    </div>
                </div>
            </div>
        );
    }

    // if (
    //     (orderData && orderData.status === 'canceled') ||
    //     (paymentStatus && paymentStatus === 'failed')
    // ) {
    //     return (
    //         <FailedPage
    //             data={orderData}
    //             handleReorder={handleReorder}
    //             snapStatus={snapStatus}
    //         />
    //     );
    // }

    const isFailedStatusPage = (orderData && orderData.status === 'canceled') ||
        (paymentStatus && paymentStatus === 'failed')

    const handleViewOrderClick = () => {
        history.push({
            pathname: `/account-information/order/${orderData.order_number}`
        });
    };

    return (
        <div className={classes.root}>
            <StoreTitle>Thank You</StoreTitle>
            <div className={classes.wrapper}>
                <div className={classes.iconWrapper}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="132" height="132" viewBox="0 0 132 132" fill="none">
                        <path d="M71.4424 108.263H24.9789C19.1153 108.256 14.336 103.559 14.2284 97.6951L25.2617 35.3982H21.1083C20.0874 35.3936 19.0988 35.7561 18.3229 36.4196C17.547 37.0831 17.0354 38.0034 16.8815 39.0127L16.8739 39.0556L4.82031 107.101C4.92786 112.964 9.70748 117.661 15.5708 117.669H78.6261L76.0612 114.936C74.1865 112.964 72.6285 110.713 71.4424 108.263Z" fill="#FEF1E6"/>
                        <path d="M115.59 88.3679C111.568 84.0275 106.179 81.1976 100.322 80.3501L92.9157 38.5398C92.2616 34.324 88.6227 31.22 84.3564 31.2373H20.9853C16.719 31.2191 13.0801 34.324 12.4248 38.5401L0.339179 106.764C0.315976 106.891 0.304688 107.019 0.304688 107.147C0.314721 115.505 7.08796 122.279 15.4475 122.289H76.3311C79.25 125.925 83.0945 128.709 87.4607 130.346C91.827 131.984 96.5537 132.415 101.144 131.595C105.735 130.774 110.02 128.732 113.548 125.683C117.077 122.634 119.719 118.691 121.197 114.268C122.675 109.845 122.934 105.106 121.947 100.548C120.96 95.9908 118.764 91.7832 115.589 88.3676L115.59 88.3679ZM4.6958 107.331L16.7497 39.2845L16.7569 39.2428C16.9111 38.2336 17.4227 37.3133 18.1986 36.6497C18.9744 35.9861 19.9628 35.6233 20.9838 35.6274H84.3539C86.4642 35.6187 88.2637 37.157 88.5807 39.2428C88.5835 39.2563 88.5857 39.271 88.5882 39.2845L95.8174 80.093C91.4345 80.2206 87.1554 81.4561 83.3789 83.6841C79.6024 85.9122 76.4517 89.0602 74.2204 92.8348C71.9891 96.6093 70.7499 100.887 70.6185 105.27C70.487 109.653 71.4676 113.998 73.4686 117.899H15.4488C9.58423 117.893 4.80367 113.194 4.6958 107.331ZM96.5693 127.604C93.184 127.596 89.8476 126.795 86.8276 125.265C83.8076 123.735 81.1881 121.519 79.1792 118.794C76.8223 115.58 75.402 111.776 75.0758 107.803C74.7497 103.831 75.5305 99.8455 77.3316 96.2898C79.1328 92.7342 81.8838 89.747 85.2794 87.6598C88.675 85.5726 92.5826 84.467 96.5684 84.4656C97.1353 84.4656 97.7097 84.4875 98.2742 84.5314C109.819 85.448 118.579 95.3164 118.121 106.888C117.663 118.459 108.149 127.604 96.5681 127.605L96.5693 127.604Z" fill="#F6831F"/>
                        <path d="M52.6686 0C39.6464 0.0147374 29.0929 10.568 29.0781 23.5905V47.5535C29.0879 48.1292 29.3234 48.678 29.734 49.0817C30.1445 49.4854 30.6973 49.7116 31.2731 49.7116C31.8488 49.7116 32.4016 49.4854 32.8122 49.0817C33.2227 48.678 33.4583 48.1292 33.468 47.5535V23.5905C33.468 12.9858 42.0652 4.38986 52.6686 4.38986C63.2733 4.38986 71.8696 12.9858 71.8696 23.5905V47.5535C71.8696 48.766 72.8519 49.7484 74.0645 49.7484C75.277 49.7484 76.2594 48.766 76.2594 47.5535V23.5905C76.2447 10.5683 65.6915 0.0147374 52.6686 0ZM107.704 97.628L93.4649 111.229L86.024 103.788C85.612 103.377 85.0536 103.146 84.4714 103.146C83.8893 103.146 83.3309 103.377 82.9188 103.788C82.5072 104.2 82.276 104.758 82.276 105.34C82.276 105.922 82.5072 106.481 82.9188 106.893L91.876 115.85C92.2816 116.256 92.8298 116.486 93.4033 116.493C93.9767 116.499 94.53 116.281 94.9445 115.885L110.736 100.802C111.019 100.537 111.227 100.202 111.338 99.8304C111.449 99.4592 111.46 99.0651 111.369 98.6885C111.185 97.9206 110.603 97.312 109.845 97.0925C109.086 96.873 108.27 97.078 107.704 97.628Z" fill="#1B1A19"/>
                    </svg>
                </div>

                <h1 className={classes.title}>Purchase {isFailedStatusPage ? 'failed' : 'successful'}!</h1>

                <p className={classes.description}>
                    Your order #{orderData.order_number} will be processed and shipped to you as soon as possible.
                </p>

                <div className={classes.buttonGroup}>
                    <button
                        className={classes.viewOrderBtn}
                        onClick={handleViewOrderClick}
                    >
                        View order
                    </button>
                    <button
                        className={classes.homeBtn}
                        onClick={handleLinkClick}
                    >
                        Home
                    </button>
                </div>

                <div className={classes.pointsCard}>
                    <div className={classes.pointsIconWrapper}>
                        <img
                            style={{ marginRight: 8, fontSize: 28 }}
                            src={'/venia-static-assets/images/gim.png'}
                        />
                    </div>
                    <div className={classes.pointsContent}>
                        <h3 className={classes.pointsTitle}>Points earned</h3>
                        <p className={classes.pointsDesc}>Points will be added after order is shipped to you.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThanksPage;
