import React, { useState } from 'react';
import { Form } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Password from '@magento/venia-ui/lib/components/Password';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import signInClasses from '@magento/venia-ui/lib/components/SignIn/signIn.module.css';
import Field from '@magento/venia-ui/lib/components/Field';
import BindPhoneNumber from './bindPhoneNumber';
import VerifyCodeModal from './verifyCodeModal';
import SignUpModal from './signUpModal';
import VerificationMethodModal from './VerificationMethodModal';
import localClasses from './emailSignIn.module.css';
import {
    isRequired,
    validateEmail
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { useToast } from '../Common/Toast';
import { Loader } from 'react-feather';
import { useSignIn, useSignInCommon } from '../../../../overrides/peregrine/talons/SignIn/useSignIn'




const EmailSignIn = ({
    talonProps = {},
    classes: classesProp = {},
    setFormApi,
    handleCreateAccount,
    handleViewMode,
    handleForgotPassword,
}) => {
    const { showToast, showSuccess, showInfo, showError, hideToast } = useToast();
    const classes = useStyle(localClasses, signInClasses, classesProp);
    const { formatMessage } = useIntl();
    const { setAccessToken, setRefreshToken, getAccessToken } = useSignInCommon()
    const { handleBindPhoneNumber, handleUpdateCustomerInformationApi, handleVerifyPhoneOTPApi, handleEmailSignInApi, AuthNextStep, VerifyStatus } = talonProps
    const [showBindPhoneNumberModal, setShowBindPhoneNumberModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [sendCodeMethod, setSendCodeMethod] = useState(''); // 选中获取手机号的方式
    const [verifyPhone, setVerifyPhone] = useState(null);
    const [pendingPayload, setPendingPayload] = useState({});
    const [showVerifyCodeModal, setShowVerifyCodeModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialInfoData, setInitialInfoData] = useState({})
    const [accountInfo, setAccountInfo] = useState({})
    const [phoneErrorMessage, setPhoneErrorMessage] = useState('')
    const [isRendCodeLoading, setIsRendCodeLoading] = useState(false);
    const [loginRadiusSmsEnabled, setLoginRadiusSmsEnabled] = useState(false);


    const handleUseEmail = () => {
        if (typeof handleViewMode === 'function') handleViewMode('phone');
    };

    const handleEmailSubmit = async ({ email, password }) => {
        setLoading(true);
        try {
            const res = await handleEmailSignInApi({ email, password })
            const data = res?.data?.generateCustomerTokenCustom || {}
            const { message, status, next_step, lr_data, customer_data } = data

            if (status === VerifyStatus.SUCCESS) {
                if (customer_data) {
                    const { phonenumber, ...other } = customer_data
                    setInitialInfoData({ ...other, phonenumber: /^\+\s*\d+/.test(phonenumber) ? phonenumber : `+${phonenumber}` })
                    setAccountInfo(lr_data)
                    const { access_token, expires_in, refresh_token } = lr_data || {}
                    setAccessToken(access_token, expires_in)
                    setRefreshToken(refresh_token)
                }
                if (next_step === AuthNextStep.BIND_PHONE) {
                    setPhoneErrorMessage('')
                    setShowBindPhoneNumberModal(true)
                } else if (next_step === AuthNextStep.COMPLETE_PROFILE) {
                    setShowSignUpModal(true)
                }

            } else {
                showInfo(message)
            }
        } catch (error) {
            console.log(error);
            showInfo(error.message)
        } finally {
            setLoading(false);

        }
    }

    // 当 VerificationMethodModal 内部调用后成功回调到此处
    const handleVerificationMethodSuccess = async () => {
        // 关闭选择 modal
        setShowVerificationModal(false);
        // 将手机号用于后续的验证码输入流程（覆盖式弹窗）
        if (pendingPayload && pendingPayload.phone) {
            setVerifyPhone(pendingPayload.phone);
            setShowVerifyCodeModal(true);
        } else {
            // 若没有 pendingPayload，仍回传给父处理

        }
    };

    const handleRequestSendPhoneOTPApi = async ({ phoneId, method }) => {
        if (!phoneId) return

        try {
            const access_token = await getAccessToken()
            const result = await handleBindPhoneNumber({ method, phoneId, access_token })

            const { bindPhoneNumber } = result?.data || {}
            const { message, success } = bindPhoneNumber || {}

            if (success) {
                showSuccess(message)
                return { status: true, message }
            } else {
                if (showVerifyCodeModal) {
                    showInfo(message)
                } else {
                    setPhoneErrorMessage(message)
                }
                return { status: false, message }
            }
        } catch (error) {
            if (showVerifyCodeModal) {
                showInfo(error.message)
            } else {
                setPhoneErrorMessage(error.message)
            }
            console.log(error.message);
            return { status: false, message: error.message }
        }
    }

    const handleModalSuccess = async ({ method, phoneId }) => {
        if (!pendingPayload) return;
        setIsRendCodeLoading(true)
        const { status } = await handleRequestSendPhoneOTPApi({ method, phoneId })
        setIsRendCodeLoading(false)
        if (!status) return

        setSendCodeMethod(method)
        setShowBindPhoneNumberModal(false)
        setShowVerificationModal(false);
        handleVerificationMethodSuccess()
    };

    // VerifyCodeModal 的确认回调（输入 OTP 后）
    const handleConfirmCode = async ({ payload, code }) => {
        if (!payload.phone || !code) return;
        // setLoading(true);
        try {
            // catch 临时用于测试
            const { phone, country } = payload;
            const phoneNumber = `${country}${phone}`
            const res = await handleVerifyPhoneOTPApi({ phoneId: phoneNumber, otp: code, prev_step: 'BIND_PHONE' })

            const data = res?.data || {}
            const { next_step, token, lr_data, message, status } = data.verifyPhoneOTP || {}
            const { OTP_INVALID, OTP_EXPIRED, TOO_MANY_ATTEMPTS } = VerifyStatus

            // 判断需要完成用户信息（根据后端返回的数据）
            if (next_step === AuthNextStep.SIGN_UP || next_step === AuthNextStep.COMPLETE_PROFILE) {
                setShowVerifyCodeModal(false);
                if (lr_data?.profile) {
                    const phone_number = lr_data?.profile.phone_number || ''
                    setInitialInfoData({ ...initialInfoData, phonenumber: phone_number })
                    setAccountInfo(lr_data)
                    const { access_token, expires_in, refresh_token } = lr_data || {}
                    setAccessToken(access_token, expires_in)
                    setRefreshToken(refresh_token)
                }
                setShowSignUpModal(true);

            } else if ([OTP_INVALID, OTP_EXPIRED, TOO_MANY_ATTEMPTS].includes(status)) {
                showInfo(message)
                return false
            } else if (status === VerifyStatus.SUCCESS && next_step === AuthNextStep.LOGIN_SUCCESS && token) {
                setShowVerifyCodeModal(false);
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log('error', error)
            showInfo(error.message)
        } finally {
            setLoading(false);
        }
    };

    const handleBindPhoneNumberModalNext = (payload, loginRadiusSmsEnabled) => {
        setPendingPayload(payload)
        setLoginRadiusSmsEnabled(loginRadiusSmsEnabled)
        setShowVerificationModal(true)
    }

    const handdleSignUpModalFormSubmit = async (formData) => {
        // 合并手机验证数据和注册表单数据
        // const { access_token } = accountInfo || {}
        const access_token = await getAccessToken()

        const infoData = {
            email: formData.email,
            firstname: formData.firstname,
            lastname: formData.lastname,
            phonenumber: formData.phonenumber,
            access_token
        };


        if (formData.gender) {
            infoData.gender = formData.gender
        }

        if (formData.date_of_birth) {
            infoData.date_of_birth = formData.date_of_birth
        }

        try {
            const res = await handleUpdateCustomerInformationApi(infoData)
            return res?.data?.updateCustomerCustom || {}

        } catch (error) {
            showInfo(error.message)
            return false
        }
    }

    return (
        <div className={localClasses.root}>
            <div style={showSignUpModal ? { display: 'none' } : {}}>
                <div className={classes.header}>
                    {/* <FormattedMessage
                                    id="signInPage.header2"
                                    defaultMessage="Customer Login"
                                /> */}
                    <div className={classes.headerText}>LOGIN</div>
                    <div className={classes.headerTipText}>Please enter your account information below to login!</div>
                </div>
                <Form
                    getApi={setFormApi}
                    className={classes.form}
                    onSubmit={handleEmailSubmit}
                >
                    <Field
                        isRequired={true}
                        label={formatMessage({
                            id: 'signIn.emailAddressTextNew',
                            defaultMessage: 'Email'
                        })}
                    >
                        <TextInput
                            autoComplete="email"
                            field="email"
                            placeholder={formatMessage({
                                id: 'signIn.emailAddressPlaceholder',
                                defaultMessage: 'Enter your Email'
                            })}
                            validate={combine([isRequired, validateEmail])}
                            validateOnBlur
                        />
                    </Field>

                    <Password
                        fieldName="password"
                        label={formatMessage({
                            id: 'signIn.passwordTextNew',
                            defaultMessage: 'Password'
                        })}
                        placeholder={formatMessage({
                            id: 'signIn.passwordPlaceholder',
                            defaultMessage: 'Enter your Password'
                        })}
                        className={localClasses.passwordField}
                        validateOnBlur
                        autoComplete="current-password"
                        isToggleButtonHidden={false}
                    />

                    <div className={classes.buttonsContainer}>
                        <div className={classes.buttonWrapper}>
                            <Button
                                priority="high"
                                type="submit"
                                className={classes.buttonsSignIn}
                                disabled={loading}
                            >
                                {loading && <Loader size={14} color="#fff" />}
                                <FormattedMessage
                                    // id={'signIn.signInText'}
                                    id='emailSignIn.signInText'
                                    defaultMessage="LOGIN"
                                />
                            </Button>

                            <div className={classes.forgotPasswordButtonContainer}>
                                <LinkButton
                                    classes={{ root: classes.forgotPasswordButton }}
                                    type="button"
                                    onClick={handleForgotPassword}
                                >
                                    <FormattedMessage
                                        id={'signIn.forgotPasswordTextNew'}
                                        defaultMessage={'Forgot Password?'}
                                    />
                                </LinkButton>
                            </div>
                        </div>
                    </div>
                </Form>

                <div className={localClasses.divider}>
                    <div className={localClasses.dividerLine} />
                    <div className={localClasses.dividerText}>OR</div>
                    <div className={localClasses.dividerLine} />
                </div>

                {/* <div className={classes.buttonWrapper}>
                        <span className={classes.labelText}>
                            <FormattedMessage
                                id={'signIn.labelText'}
                                defaultMessage={'Dont have an account yet?'}
                            />
                        </span>
                        <Button
                            priority="low"
                            type="button"
                            className={classes.buttonsCreateAccount}
                            onClick={handleCreateAccount}
                        >
                            <FormattedMessage
                                id={'signIn.createAccountText2'}
                                defaultMessage={'Register'}
                            />
                        </Button>
                    </div> */}
                <div className={classes.buttonWrapper}>
                    <Button
                        priority="low"
                        type="button"
                        className={classes.buttonsCreateAccount}
                        onClick={handleUseEmail}
                    >
                        Login/Register with Phone Number
                    </Button>
                </div>
            </div>


            <BindPhoneNumber
                open={showBindPhoneNumberModal}
                phoneErrorMessage={phoneErrorMessage}
                setPhoneErrorMessage={setPhoneErrorMessage}
                isRendCodeLoading={isRendCodeLoading}
                onNext={handleBindPhoneNumberModalNext}
                onClose={() => { setShowBindPhoneNumberModal(false); }}
            />

            <VerificationMethodModal
                smsEnabled={loginRadiusSmsEnabled}
                open={showVerificationModal}
                onClose={() => { setShowVerificationModal(false) }}
                payload={pendingPayload}
                onSuccess={handleModalSuccess}
            />

            <VerifyCodeModal
                open={showVerifyCodeModal}
                phone={verifyPhone}
                payload={pendingPayload}
                onResend={handleRequestSendPhoneOTPApi}
                method={sendCodeMethod}
                onConfirm={handleConfirmCode}
                onClose={() => { setShowVerifyCodeModal(false) }}
            />

            <SignUpModal
                open={showSignUpModal}
                onNext={handdleSignUpModalFormSubmit}
                signUpType='email'
                phoneNumber={pendingPayload.phone}
                initialCountry={pendingPayload.country}
                onClose={() => {
                    setShowSignUpModal(false);
                    // 关闭注册表单时，可以选择返回验证码页面或关闭所有弹窗
                    // setShowVerifyCodeModal(true);
                }}
                initialData={initialInfoData}
            />
        </div>
    );
};

EmailSignIn.propTypes = {
    classes: PropTypes.object,
    setFormApi: PropTypes.func,
    handleSubmit: PropTypes.func,
    handleCreateAccount: PropTypes.func,
    handleViewMode: PropTypes.func,
    handleForgotPassword: PropTypes.func,
    isBusy: PropTypes.bool
};

export default EmailSignIn;
