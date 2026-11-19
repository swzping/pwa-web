import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, Loader } from 'react-feather';
import { useToast } from '../../../../../modules/custom-modules/components/Common/Toast';
import { Form, useFormApi } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import classes from './verifyEmailCodeModal.module.css';
import DEFAULT_OPERATIONS from '../../../../../overrides/peregrine/talons/SignIn/signIn.gql'
import { useMutation } from '@apollo/client';
import Button from '@magento/venia-ui/lib/components/Button';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';


/**
 * Single hidden input + fake boxes verification modal
 *
 * props:
 * - open: boolean
 * - email: string (显示用)
 * - onConfirm(code) => Promise
 * - onResend() => Promise
 * - onClose() optional
 */
const VerifyEmailModal = ({ open, email, onConfirm, onClose }) => {
    const [requestEmailOTPApi, { error: requestEmailOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestEmailOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );
    const { formatMessage } = useIntl();

    const { showInfo, showSuccess } = useToast()
    const [busy, setBusy] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');
    const formApiRef = useRef();


    useEffect(() => {
        if (open) {
        } else {
        }
    }, [open]);

    const emailValidator = useCallback(
        value => {
            const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@[a-zA-Z0-9\-\.]+\.(?:com|co\.id|id)$/;

            if (!value) {
                setIsValid(false)
                return { id: 'email.invalid', defaultMessage: 'Please enter your email.' };
            }

            if (!emailRegex.test(value)) {
                setIsValid(false)
                return {
                    id: 'email.invalid', defaultMessage: 'The email address format seems incorrect, please check it.'
                };
            }

            if (emailErrorMessage) {
                return {
                    id: 'email.invalid', defaultMessage: emailErrorMessage
                };
            }

            setIsValid(true)

            return undefined;
        },
        []
    );

    const handleSendOTP = async (email) => {

        const emailStatusMap = {
            SENT_VERIFIED_EMAIL: 'SENT_VERIFIED_EMAIL',
            VERIFIED_SUCCESS: 'VERIFIED_SUCCESS',
            VERIFIED_ERROR: 'VERIFIED_ERROR',
        }

        try {
            setBusy(true)
            const res = await requestEmailOTPApi({
                variables: { email, isCheckoutVerify: true, accessToken: '' }
            })
            setBusy(false)
            const { status, message } = res?.data?.verifyEmail || {}
            if (status === emailStatusMap.VERIFIED_SUCCESS) {
                showSuccess(message)
                return true
            } else if (status === emailStatusMap.SENT_VERIFIED_EMAIL) {
                showSuccess(message)
                return true
            } else if (status === emailStatusMap.VERIFIED_ERROR) {
                const api = formApiRef.current;
                if (typeof api?.setError === 'function') {
                    api.setError('email', {
                        id: 'email.invalid', defaultMessage: message
                    });
                }
                setEmailErrorMessage(message)
                return false
            } else {
                showInfo(message)
                return false

            }
        } catch (error) {
            setBusy(false)
            showInfo(error.message);
            return false
        }
    }

    const handleSubmit = async (values) => {
        const email = values.email
        const isSuccess = await handleSendOTP(email)
        if (!isSuccess) return

        onConfirm(email)
    };





    if (!open) return null;

    return (
        <div className={classes.container} aria-hidden={!open} onClick={() => onClose && onClose()}>
            <div className={classes.card} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className={classes.title}>Email verification</div>

                <div className={classes.subtitle}>In order to proceed with your order, you need to add your email first！</div>
                {/* <div className={classes.subtitle}>{email || ''}</div> */}

                <Form className={[classes.formInfo].join(' ')} onSubmit={handleSubmit} getApi={api => { formApiRef.current = api; }}>
                    {/* Email */}
                    <Field
                        isRequired
                        id='email'
                        label={formatMessage({ id: 'signUp.email', defaultMessage: 'Email' })}
                    >
                        <div className={classes.emailWrapperStyle}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <TextInput
                                    field="email"
                                    className={classes.inputStyle}
                                    validate={emailValidator}
                                    validateOnBlur
                                    initialValue={email}
                                    onChange={() => {
                                        setEmailErrorMessage('')
                                    }}
                                    placeholder={formatMessage({ id: 'email.placeholder', defaultMessage: 'Enter your Email' })}
                                />
                                {/* {isHasValidEmail && !emailVerified && <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className={defaultClasses.verifyButtonStyle}
                                >
                                    Verify
                                </button>} */}
                            </div>

                        </div>
                    </Field>

                    <div style={{ marginTop: '40px' }} className={classes.actionsWrap}>
                        <Button
                            type="submit"
                            disabled={busy}
                            className={isValid ? classes.confirmButton : classes.confirmButtonDisabled}
                        >
                            {busy && <Loader size={14} color="#fff" />}
                            <FormattedMessage
                                id={'signIn.verify'}
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
                </Form>
            </div>
        </div >
    );
};

VerifyEmailModal.propTypes = {
    open: PropTypes.bool,
    email: PropTypes.string,
    onConfirm: PropTypes.func,
    onResend: PropTypes.func,
    onClose: PropTypes.func
};

export default VerifyEmailModal;
