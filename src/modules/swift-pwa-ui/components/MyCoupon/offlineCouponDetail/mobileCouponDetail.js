import React from 'react';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import { ChevronLeft } from 'react-feather';

import Barcode from './components/Barcode';

import { formatDateRange } from './couponUtils';
import classes from './offlineCoupon.module.css';

const MobileCouponDetails = ({ couponData, onClose }) => {
    const imageSrc = couponData?.image?.[0];
    return (
        <main className={classes.mobileCouponPage}>
            <div className={classes.couponHeader}>
                <div className={classes.couponIconWrapper}>
                    <button className={classes.couponBackButton} type="button" onClick={onClose} aria-label="Back">
                        <ChevronLeft />
                    </button>
                </div>
                <div className={classes.couponHeaderTitle}>Voucher Details</div>
            </div>
            <div className={classes.content}>
                <div className={classes.badgeWrap}>
                    <img className={classes.couponBadge} src={imageSrc} alt="coupon-icon" />
                    <div className={classes.badgeTitle}>{couponData.name}</div>
                </div>

                <section className={classes.summary}>
                    <div className={classes.summaryContent}>
                        <div className={classes.couponName}>{couponData.description}</div>
                        <div className={classes.summaryMeta}>
                            <div className={classes.couponType}>Offline Only</div>
                            <span>Valid date: {formatDateRange(couponData.from_date, couponData.to_date)}</span>
                        </div>
                    </div>
                </section>
                {couponData?.code ? (
                    <section className={classes.barcodeSection}>
                        <div className={classes.barcodeTitle}>Voucher Code</div>
                        <Barcode value={couponData.code} />
                        <div className={classes.barcodeText}>Present to store staff · One-time use only</div>
                    </section>
                ) : null}
                {couponData?.t_and_c ? <div className={classes.conditionsList}>{parse(couponData.t_and_c)}</div> : null}
            </div>
        </main>
    );
};

MobileCouponDetails.propTypes = {
    coupon: PropTypes.object.isRequired,
    generalConditions: PropTypes.string.isRequired,
};

export default MobileCouponDetails;
