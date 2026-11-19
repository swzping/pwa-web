import React from 'react';
import PropTypes from 'prop-types';
import classes from './activityModal.module.css';

const OfflineActivityModal = ({
    visible,
    title,
    description,
    isGilroyFont = false,
    confirmText = 'Back',
    onConfirm = () => {}
}) => {
    if (!visible) return null;

    return (
        <div
            className={`${classes.backdrop} ${
                isGilroyFont ? classes.gilroyFont : ''
            }`}
            role="dialog"
            aria-modal="true"
        >
            <div className={classes.card}>
                <div className={classes.title}>{title}</div>
                <div className={classes.description}>{description}</div>
                <button className={classes.okButton} onClick={onConfirm}>
                    {confirmText}
                </button>
            </div>
        </div>
    );
};

OfflineActivityModal.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.node,
    description: PropTypes.node,
    confirmText: PropTypes.string,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func
};

OfflineActivityModal.defaultProps = {
    open: false,
    title: '',
    description: '',
    confirmText: 'Back'
};

export default OfflineActivityModal;
