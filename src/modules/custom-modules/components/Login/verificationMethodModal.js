import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X as CloseIcon, ChevronRight } from 'react-feather';
import classes from './verificationMethodModal.module.css';
import DEFAULT_OPERATIONS from '../../../../overrides/peregrine/talons/SignIn/signIn.gql'
import { useMutation } from '@apollo/client';
import { useToast } from '../Common/Toast';


const VerificationMethodModal = ({ open, onClose, smsEnabled, payload, onSuccess }) => {
    const [requestPhoneOTPApi, { error: requestPhoneOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const { showInfo, showSuccess } = useToast()
    const [loadingMethod, setLoadingMethod] = useState(null);

    // 打开/关闭时重置内部状态，保证回调成功后不会残留 loading/error
    useEffect(() => {
        if (open) {
            setLoadingMethod(null);
        } else {
            // 关闭时也清理状态
            setLoadingMethod(null);
        }
    }, [open]);

    if (!open) return null;






    const handleSelect = async method => {
        if (!payload) {
            return;
        }

        setLoadingMethod(method);

        // 成功后回调父组件（携带 method 与后端返回的数据）
        if (typeof onSuccess === 'function') {
            const { phone, country } = payload
            const phoneNumber = `${country}${phone}`
            onSuccess({ method, phoneId: phoneNumber });
        }
        // modal 默认关闭（父也可以在回调中关闭）
        if (typeof onClose === 'function') onClose();


    };

    return (
        <div className={classes.backdrop} role="dialog" aria-modal="true">
            <div className={classes.box}>
                <button
                    aria-label="close"
                    onClick={() => { if (onClose) onClose(); }}
                    className={classes.closeButton}
                >
                    <CloseIcon />
                </button>
                <div>
                    <div className={classes.headerTitle}>Choose a verification method</div>
                    <p className={classes.headerText}>
                        We need to verify your identity with one of the following method.
                    </p>
                </div>

                <div className={classes.methods}>
                    <button
                        onClick={() => handleSelect('whatsapp')}
                        className={classes.methodItem}
                        disabled={!!loadingMethod}
                    >
                        <img src='/venia-static-assets/images/whatsapp_icon.png' alt="WhatsApp" className={classes.methodIcon} />
                        <div className={classes.methodContent}>
                            <div className={classes.methodTitle}>WhatsAPP</div>

                        </div>
                        {loadingMethod === 'whatsapp'
                            ? <div className={classes.statusText}>Sending...</div>
                            : <ChevronRight size={16} />}

                    </button>

                    <button
                        onClick={() => handleSelect('sms')}
                        className={classes.methodItem}
                        disabled={!!loadingMethod || !smsEnabled}
                    >
                        {/* 禁用蒙层 */}
                        {!smsEnabled && <div className={classes.methodDisabledLayer}></div>}
                        <img src="/venia-static-assets/images/text_message_icon.png" alt="Text message" className={classes.methodIcon} />
                        <div className={classes.methodContent}>
                            <div className={classes.methodTitle}>Text Message</div>
                        </div>
                        {loadingMethod === 'sms'
                            ? <div className={classes.statusText}>Sending...</div>
                            : <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

VerificationMethodModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    payload: PropTypes.object, // { country, phone }
    onSuccess: PropTypes.func,
};

export default VerificationMethodModal;
