import React from 'react';
import PropTypes from 'prop-types';
import classes from './offlineCoupon.module.css';
import parse from 'html-react-parser';
import { formatDateRange } from './couponUtils';

const DesktopCouponDialog = ({ couponData, onClose }) => {
    const imageSrc =
        couponData?.image?.[0] || 'https://mcstaging2.guardianindonesia.co.id//media/salesrule/image/coupon1.jpg';
    return (
        <div className={classes.desktopCouponPage} role="dialog" aria-modal="true" aria-labelledby="offline-coupon-title">
            <section className={classes.desktopDialog}>
                <div className={classes.headerContainer}>
                    <button
                        className={classes.closeButton}
                        type="button"
                        onClick={onClose}
                        aria-label="Close voucher details"
                    >
                        ×
                    </button>
                </div>
                <div className={classes.desktopDialogContent}>
                    <div className={classes.desktopContent}>
                        <section className={classes.summary}>
                            <div className={classes.couponBadgeContainer}>
                                <img className={classes.couponBadge} src={imageSrc} alt="coupon-icon" />
                            </div>
                            <div className={classes.summaryContent}>
                                <div className={classes.couponName}>{couponData.name}</div>
                                <div className={classes.couponDescription}>{couponData.description}</div>
                                <div className={classes.summaryMeta}>
                                    <span>Valid date: {formatDateRange(couponData.from_date, couponData.to_date)}</span>
                                </div>
                            </div>
                        </section>
                        <div className={classes.desktopInfoRow}>
                            <span>Offline Only</span>
                            <span>Code : {couponData.code || '-'}</span>
                        </div>
                        <p className={classes.openNoticeText}>Open the app to view your voucher barcode.</p>
                        {couponData?.t_and_c ? (
                            <div className={classes.conditionsList}>{parse(couponData.t_and_c)}</div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
};

DesktopCouponDialog.propTypes = {
    coupon: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    generalConditions: PropTypes.string.isRequired,
};

export default DesktopCouponDialog;
