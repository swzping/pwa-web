import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, Loader, Info } from 'react-feather';
import { useToast } from '../Common/Toast';
import classes from './verifyPhoneCodeModal.module.css';
import DEFAULT_OPERATIONS from '../../../../overrides/peregrine/talons/SignIn/signIn.gql'
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import Button from '@magento/venia-ui/lib/components/Button';

/**
 * Single hidden input + fake boxes verification modal
 *
 * props:
 * - open: boolean
 * - phone: string (显示用)
 * - onConfirm(code) => Promise
 * - onResend() => Promise
 * - onClose() optional
 */
const VerifyPhoneCodeModal = ({ open, phone, method, payload, onConfirm, onResend, onClose }) => {
    const [requestPhoneOTPApi, { error: requestPhoneOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestResendPhoneOTPApi, { error: requestResendPhoneOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestResendPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const LENGTH = 6;
    const [values, setValues] = useState(Array(LENGTH).fill(''));
    const hiddenRef = useRef(null);
    const [countdown, setCountdown] = useState(0);
    const [busy, setBusy] = useState(false);
    const [caretVisible, setCaretVisible] = useState(true);
    // 是否处于输入框聚焦状态（用于控制 fake boxes 的聚焦表现）
    const [isFocused, setIsFocused] = useState(false);
    const { showInfo, showSuccess } = useToast();
    const [verifyCodeErrorMessage, setVerifyCodeErrorMessage] = useState('');
    // 验证码有效期（秒），5分钟 = 300s
    const VERIFY_TTL = 300;
    const [verifyTTL, setVerifyTTL] = useState(0);
    const verifyIntervalRef = useRef(null);

    // caret blink
    useEffect(() => {
        const t = setInterval(() => setCaretVisible(v => !v), 530);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (open) {
            setCountdown(30)
            setValues(Array(LENGTH).fill(''));
            // setError(null);
            setVerifyCodeErrorMessage('');
            // 启动/重置验证码有效期倒计时
            setVerifyTTL(VERIFY_TTL);
            setTimeout(() => {
                try { hiddenRef.current && hiddenRef.current.focus(); } catch (e) { }
            }, 50);
        } else {
            // 清理时确保 hidden input 失焦
            try { hiddenRef.current && hiddenRef.current.blur(); } catch (e) { }
            // 关闭时重置倒计时，确保不会在关闭时继续倒计时
            setCountdown(0);
        }
    }, [open]);


    // 使用单个 interval 每秒递减，verifyTTL 到 0 时设置错误提示
    useEffect(() => {
        // 清理旧 interval
        if (verifyIntervalRef.current) {
            clearInterval(verifyIntervalRef.current);
            verifyIntervalRef.current = null;
        }

        // 仅在 modal 打开且有剩余秒数时启用 interval
        if (open && verifyTTL > 0) {
            verifyIntervalRef.current = setInterval(() => {
                setVerifyTTL(v => {
                    if (v <= 1) {
                        // 到期：清 interval，设置错误提示并归零
                        if (verifyIntervalRef.current) {
                            clearInterval(verifyIntervalRef.current);
                            verifyIntervalRef.current = null;
                        }
                        setVerifyCodeErrorMessage('Verification code expired. Please request a new code.');
                        return 0;
                    }
                    return v - 1;
                });
            }, 1000);
        } else if (!open) {
            // modal 关闭时确保清理
            setVerifyCodeErrorMessage('');
            setVerifyTTL(0);
        }

        return () => {
            if (verifyIntervalRef.current) {
                clearInterval(verifyIntervalRef.current);
                verifyIntervalRef.current = null;
            }
        };
    }, [open, verifyTTL]);

    useEffect(() => {
        let t;
        if (open && countdown > 0) {
            t = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(t);
    }, [countdown, open]);


    // paste handling on hidden input
    const handleHiddenPaste = e => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, LENGTH);
        if (!paste) return;
        setValues(prev => {
            const nv = [...prev];
            // fill sequentially from first empty
            let pos = 0;
            for (let i = 0; i < LENGTH; i++) nv[i] = '';
            for (let i = 0; i < paste.length && i < LENGTH; i++) {
                nv[i] = paste[i];
            }
            return nv;
        });
    };

    const handleBlur = () => {
        // 失焦时关闭 caret 并标记为非聚焦
        setCaretVisible(false);
        setIsFocused(false);
    }

    const handleFocus = () => {
        setIsFocused(true);
        setCaretVisible(true);
    }

    const handleInputChange = (e) => {
        const v = (e.target.value || '').replace(/\D/g, '').slice(0, LENGTH);
        if (!v) {
            setValues(Array(LENGTH).fill(''));
            return;
        }
        setValues(() => {
            const nv = Array(LENGTH).fill('');
            for (let i = 0; i < v.length && i < LENGTH; i++) nv[i] = v[i];
            return nv;
        });
    }

    const handleKeyDown = (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
        }
    }

    const code = values.join('');
    const filledCount = values.filter(v => v).length;
    const activeConfirm = code.length === LENGTH
    const canConfirm = activeConfirm && !busy;

    const handleConfirm = async () => {
        if (!canConfirm) return;
        setBusy(true);
        try {
            if (onConfirm) {
                const isValid = await onConfirm({ payload, code });

                if (!isValid) {
                    setValues(Array(LENGTH).fill(''));
                    hiddenRef.current && hiddenRef.current.blur();
                }
            }
        } catch (e) {
            showInfo(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        try {
            setCountdown(30);

            if (onResend) {
                const { phone, country } = payload
                const phoneNumber = `${country}${phone}`
                await onResend({ phoneId: phoneNumber, method });
                // resend 成功后重置验证码有效期和清理错误；重启 interval（setVerifyTTL 会触发 effect）
                setVerifyCodeErrorMessage('');
                setVerifyTTL(VERIFY_TTL);
            }
            // else {
            //     const { phone, country } = payload
            //     const phoneNumber = `${country}${phone}`
            //     const result = await requestResendPhoneOTPApi({
            //         variables: { method, phoneId: phoneNumber }
            //     })
            //     const { requestPhoneOTP } = result?.data || {}
            //     const { message, success } = requestPhoneOTP || {}

            //     if (success) {
            //         showSuccess(message);

            //         // 重置验证码有效期并清理错误（setVerifyTTL 会触发上面的 effect 启动 interval）
            //         setVerifyCodeErrorMessage('');
            //         setVerifyTTL(VERIFY_TTL);
            //     } else {
            //         showInfo(message);
            //     }
            // }
        } catch (error) {
            // setError(e?.message || 'Resend failed');
            showInfo(error.message)
        } finally {
        }
    };

    if (!open) return null;

    return (
        <div className={classes.container} aria-hidden={!open} onClick={() => onClose && onClose()}>
            <div className={classes.card} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className={classes.title}>Verify</div>

                <div className={classes.subtitle}>Please enter the verification code sent to your phone number!</div>


                {/* single hidden input */}
                <input
                    ref={hiddenRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onInput={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onPaste={handleHiddenPaste}
                    style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0, border: 0, padding: 0, margin: 0 }}
                    aria-hidden="true"
                />

                {/* fake boxes */}
                <div
                    className={classes.inputsWrap}
                    onClick={() => {
                        try { hiddenRef.current && hiddenRef.current.focus(); } catch (e) { }
                    }}
                >
                    {Array.from({ length: LENGTH }).map((_, idx) => {
                        const digit = values[idx];
                        const showCaret = isFocused && filledCount === idx && digit === '' && caretVisible;
                        return (
                            <div
                                key={idx}
                                className={(isFocused && idx <= filledCount) ? classes.boxActive : classes.box}
                                aria-hidden="true"
                            >
                                {digit ? (
                                    <span>{digit}</span>
                                ) : (
                                    showCaret ? <div className={classes.caret}>_</div> : null
                                )}
                            </div>
                        );
                    })}
                </div>

                {verifyCodeErrorMessage && (<div className={classes.hintTextStyle} style={{ color: '#CC2B1E' }}>
                    <Info size={12} style={{ marginRight: 4 }} />
                    {verifyCodeErrorMessage}
                </div>)}

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div
                        className={countdown ? classes.resend : classes.resendActive}
                        onClick={handleResend}
                        role="button"
                        tabIndex={0}
                    >
                        {countdown > 0 ? `RESEND (${countdown}s)` : 'RESEND'}
                    </div>
                </div>

                <div className={classes.actionsWrap}>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className={activeConfirm ? classes.confirmButton : classes.confirmButtonDisabled}
                    >
                        {busy && <Loader size={14} color="#fff" />}
                        <FormattedMessage
                            id={'signIn.Confirm'}
                            defaultMessage="Confirm"
                        />
                    </Button>

                    <Button
                        type="button"
                        onClick={() => onClose && onClose()}
                        className={classes.closeButton}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div >
    );
};

VerifyPhoneCodeModal.propTypes = {
    open: PropTypes.bool,
    phone: PropTypes.string,
    method: PropTypes.string,
    payload: PropTypes.object,
    onConfirm: PropTypes.func,
    onResend: PropTypes.func,
    onClose: PropTypes.func
};

export default VerifyPhoneCodeModal;
