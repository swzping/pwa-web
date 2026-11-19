import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classes from './MilestoneAwardModal.module.css';
import { useHistory } from 'react-router-dom';

const MilestoneAwardModal = ({
    open,
    title = 'Congratulations!',
    message = 'You have received the voucher!',
    bannerText = '',
    buttonText = 'GO GET IT',
    onCancel
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const history = useHistory();

    useEffect(() => {
        if (open) {
            setIsAnimating(true);
        } else {
            setIsAnimating(false);
        }
    }, [open]);

    if (!open) return null;

    const handleClose = () => {
        onCancel && onCancel();
    };
    const handleGoPage = () => {
        handleClose()
        history.push('/myCouponList');
    };

    return (
        <div className={classes.overlay} role="dialog" aria-modal="true" onClick={handleClose}>
            <div
                className={`${classes.card} ${isAnimating ? classes.cardVisible : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div
                    className={`${classes.colourBg} ${isAnimating ? classes.colourBgScale : ''}`}
                    aria-hidden
                />
                <div className={classes.content}>
                    <div className={classes.banner}>
                        <span className={classes.bannerText}>{bannerText}</span>
                    </div>
                    <div className={classes.mainContent}>
                        <h2 className={classes.title}>{title}</h2>
                        <div className={classes.messageRow}>
                            <img className={classes.messageIcon} src='/venia-static-assets/images/milestone_award_coin_icon.png' alt="Coin" />
                            <span className={classes.message}>{message}</span>
                        </div>
                        <button
                            type="button"
                            className={classes.ctaButton}
                            onClick={handleGoPage}
                            aria-label={buttonText}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

MilestoneAwardModal.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    bannerText: PropTypes.string,
    buttonText: PropTypes.string,
    onCancel: PropTypes.func
};

export default MilestoneAwardModal;
