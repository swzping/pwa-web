import React from 'react';
import PropTypes from 'prop-types';
import classes from './returnBackConfirmModal.module.css';

const ConfirmCloseModal = ({ open, title = "Are you sure you want to close?", description = 'Because you cannot login into your account without having a verified phone number.', onCloseConfirm, onCancel, closeLabel = "Close", cancelLabel = "Back" }) => {
    if (!open) return null;

    return (
        <div className={classes.overlay} role="dialog" aria-modal="true">
            <div className={classes.card}>
                <div className={classes.content}>
                    <div className={classes.title}>{title}</div>
                    <div className={classes.description}>{description}</div>
                </div>
                <div className={classes.actions}>
                    <button
                        type="button"
                        onClick={() => onCloseConfirm && onCloseConfirm()}
                        className={classes.outlineButton}
                        aria-label={closeLabel}
                    >
                        {closeLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => onCancel && onCancel()}
                        className={classes.solidButton}
                        aria-label={cancelLabel}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmCloseModal.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    onCloseConfirm: PropTypes.func, // 点击 Close 的回调（确认关闭）
    onCancel: PropTypes.func,       // 点击 Back 的回调（取消）
    closeLabel: PropTypes.string,
    cancelLabel: PropTypes.string
};

export default ConfirmCloseModal;
