import React from 'react';
import PropTypes from 'prop-types';
import classes from './redeemCouponModal.module.css';

const RedeemCouponModal = ({ isOpen, onContinue, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={classes.redeemCouponModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="redeem-coupon-title"
            aria-describedby="redeem-coupon-description"
        >
            <div className={classes.redeemCouponCard}>
                <div className={classes.couponModalContent}>
                    <div className={classes.title}>Ready to redeem?</div>
                    <div className={classes.description}>
                        Please show it to the store staff once you&apos;re ready. A one-time voucher code will be
                        revealed.
                    </div>
                </div>

                <div className={classes.actions}>
                    <button
                        className={`${classes.button} ${classes.continueButton}`}
                        type="button"
                        onClick={onContinue}
                    >
                        Continue
                    </button>
                    <button className={`${classes.button} ${classes.cancelButton}`} type="button" onClick={onClose}>
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
};

RedeemCouponModal.propTypes = {
    isOpen: PropTypes.bool,
    onContinue: PropTypes.func,
    onClose: PropTypes.func,
};

RedeemCouponModal.defaultProps = {
    isOpen: false,
    onContinue: () => {},
    onClose: () => {},
};

export default RedeemCouponModal;
