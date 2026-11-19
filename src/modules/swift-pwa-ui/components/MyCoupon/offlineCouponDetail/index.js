import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from '../myCoupon.gql';
import CouponNoData from '../components/couponNoData';
import DesktopCouponDialog from './pcCouponDialog';
import MobileCouponDetails from './mobileCouponDetail';

const OfflineCoupon = ({ detailUid = '', isOpen, onClose }) => {
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
    const { getOfflineVoucherDetail } = DEFAULT_OPERATIONS;
    const urlParams = new URLSearchParams(location.search);
    const couponCode = urlParams.get('couponCode') || detailUid;

    const { data: voucherDetailData, error: voucherDetailError } = useQuery(getOfflineVoucherDetail, {
        variables: { uid: couponCode },
        skip: !isOpen || !couponCode,
        fetchPolicy: 'cache-and-network',
    });
    const offlineVoucherDetail = voucherDetailData?.offlineVoucher || {};
    const voucherDetailErrorMessage =
        [
            voucherDetailError?.graphQLErrors?.[0]?.message,
            voucherDetailError?.networkError?.message,
            voucherDetailError?.message,
        ].find(message => typeof message === 'string' && message.trim()) || 'Unable to load voucher details.';

    useEffect(() => {
        const updateViewport = () => setIsMobile(window.innerWidth < 768);

        window.addEventListener('resize', updateViewport);
        return () => window.removeEventListener('resize', updateViewport);
    }, []);

    if (!isOpen) {
        return null;
    }

    if (voucherDetailError) {
        return <CouponNoData magText={voucherDetailErrorMessage} />;
    }

    if (isMobile) {
        return <MobileCouponDetails couponData={offlineVoucherDetail} onClose={onClose} />;
    }

    return <DesktopCouponDialog couponData={offlineVoucherDetail} onClose={onClose} />;
};

OfflineCoupon.propTypes = {
    coupon: PropTypes.object,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    generalConditions: PropTypes.string,
};

OfflineCoupon.defaultProps = {
    isOpen: true,
    onClose: () => {},
};

export default OfflineCoupon;
