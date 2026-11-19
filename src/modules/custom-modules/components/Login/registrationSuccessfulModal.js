import React from 'react';
import PropTypes from 'prop-types';
import { ChevronRight } from 'react-feather';
import classes from './registrationSuccessfulModal.module.css';

const SignUpSuccessModal = ({ open, points, onClose, onView, onConfirm }) => {
    if (!open) return null;

    return (
        <div className={classes.backdrop} role="dialog" aria-modal="true">
            <div className={classes.card}>
                <img className={classes.checkCircle} src='/venia-static-assets/images/registration_successful_icon.png' alt="registrationSuccessfulIcon" />

                <div className={classes.title}>Registration successful</div>
                <div className={classes.description}>Welcome to Guardian! Now explore thousands of offers from Guardian available for you!</div>
                {/*
                <div className={classes.pointsBox}>
                    <div className={classes.pointsLeft}>
                        <img className={classes.coin} src='/venia-static-assets/images/registration_point_icon.png' alt="registrationPointIcon" />

                        <div className={classes.pointsText}>
                            Congrats! You've just earned <span className={classes.pointsValue}>+{points || 0} points.</span>
                        </div>
                    </div>

                    <div className={classes.view} onClick={() => onView && onView()}>
                        View
                        <ChevronRight size={14} color='#9E9E9E' />
                    </div>
                </div> */}

                <button className={classes.okButton} onClick={() => onConfirm && onConfirm()}>OK</button>
            </div>
        </div>
    );
};

SignUpSuccessModal.propTypes = {
    open: PropTypes.bool,
    points: PropTypes.number,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    onView: PropTypes.func
};

SignUpSuccessModal.defaultProps = {
    open: false,
    points: 0
};

export default SignUpSuccessModal;
