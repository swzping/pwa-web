import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Form } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { isRequired, isEqualToField, hasLengthAtLeast, validatePassword } from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import signInClasses from '@magento/venia-ui/lib/components/SignIn/signIn.module.css';
import { useHistory } from 'react-router-dom';
import Field from '@magento/venia-ui/lib/components/Field';
import Select from 'react-select';
import VerificationMethodModal from './VerificationMethodModal';
import VerifyCodeModal from './verifyCodeModal';
import SignUpModal from './signUpModal';
import './phoneSignIn.css';
import localClasses from './phoneSignIn.module.css';
import { useToast } from '../Common/Toast';
import { useSignIn, useSignInCommon } from '../../../../overrides/peregrine/talons/SignIn/useSignIn'
import { ChevronLeft, X as Close, Loader, Info } from 'react-feather';
import Password from '@magento/venia-ui/lib/components/Password';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';


const DEFAULT_COUNTRIES = [
    { code: '+62', label: '+62' },
    // { code: '+84', label: '+84' },
    // { code: '+86', label: '+86' },
    // { code: '+1', label: '+1' },
    // { code: '+44', label: '+44' }
];

// 每个国家本地号码常见长度（示例，可按需扩展）
const localLengthMap = {
    '+62': { min: 9, max: 12, pattern: /^\+628[1-9]\d{7,10}$/ }, // Indonesia
    '+84': { min: 8, max: 15 }, // Indonesia
    '+86': { min: 11, max: 11, pattern: /^1[3-9]\d{9}$/ }, // China
    '+1': { min: 10, max: 10 }, // US
    '+44': { min: 9, max: 10 } // UK (部分为9或10)
};

const FormTypeMap = {
    /** 登录/注册 */
    LOGIN: 'LOGIN',
    /** 创建密码 */
    CREATE_PASSWORD: 'CREATE_PASSWORD',
    /** 密码登录 */
    PASSWORD_LOGIN: 'PASSWORD_LOGIN',
    /** 忘记密码 */
    FORGET_PASSWORD: 'FORGET_PASSWORD'
}

const normalizePhone = v => (v || '').replace(/[^\d]/g, '');


const PhoneSignInInformed = ({ talonProps = {}, onNext, initialCountry = '+62', classes: classesProp = {}, handleViewMode }) => {
    const { showToast, showSuccess, showInfo, showError, hideToast } = useToast();
    const { handleRequestPhoneOTPApi, handleLoginByPhoneAndPassword, handleAddPhonePasswordApi, handleRequestResetPasswordApi, handleVerifyPhoneOTPApi, handleCreateAccountMutationApi, handleUpdateCustomerInformationApi, handleSignIn, AuthNextStep, VerifyStatus, handleRequestForgotPasswordOtpApi, handleVerifyForgotPasswordOtpApi } = talonProps
    const classes = useStyle(localClasses, signInClasses, classesProp);
    // 复用 useSignIn 的 'signIn' reCAPTCHA 实例给 phoneNumberCheck（useSignInCommon 会被多处实例化，不能内部再建实例）
    const { setAccessToken, setRefreshToken, getAccessToken, handleStoreConfig, handleCheckPhoneNumber } = useSignInCommon({ generateReCaptchaData: talonProps.generateReCaptchaData })
    const { formatMessage } = useIntl();
    const history = useHistory();
    const formApiRef = useRef(null);
    const setFormApi = useCallback(api => (formApiRef.current = api), []);
    const [loginRadiusSmsEnabled, setLoginRadiusSmsEnabled] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [sendCodeMethod, setSendCodeMethod] = useState(''); // 选中获取手机号的方式
    const [pendingPayload, setPendingPayload] = useState({}); // 待验证的手机号数据
    const [showVerifyCodeModal, setShowVerifyCodeModal] = useState(false);
    const [verifyPhone, setVerifyPhone] = useState(null);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    // const [showCreateLoginPassword, setShowCreateLoginPassword] = useState(true);
    const [formType, setFormType] = useState(FormTypeMap.LOGIN);
    const [ishasLoginPasswordFlag, setIshasLoginPasswordFlag] = useState(false);
    const [initialInfoData, setInitialInfoData] = useState({})
    const [accountInfo, setAccountInfo] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [phoneErrorMessage, setPhoneErrorMessage] = useState('')
    const [showErrorMsg, setShowErrorMsg] = useState(false) // 显示错误信息
    const [isGobalLoading, setIsGobalLoading] = useState(false) // 忘记密码流程的 loading 状态
    const [prevStep, setPrevStep] = useState('');

    // react-select 使用 { value, label } 形式的 option
    const countryOptions = useMemo(
        () => DEFAULT_COUNTRIES.map(c => ({ value: c.code, label: c.label })),
        []
    );
    const [country, setCountry] = useState(
        () => countryOptions.find(o => o.value === initialCountry) || countryOptions[0]
    );
    const countryRef = useRef(country);
    const [currentNextStep, setCurrentNextStep] = useState(null)

    useEffect(() => {
        countryRef.current = country;
    }, [country]);


    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const resizePhone = () => {
        window.onresize = function () {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone, resizePhone]);


    // 根据当前选择的国家校验手机号，返回 formatjs message descriptor 或 undefined
    const phoneValidator = useCallback(
        value => {
            const v = value;

            const len = v?.length;
            const countryCode = (countryRef.current && countryRef.current.value) || initialCountry || '+62';
            const limits = localLengthMap[countryCode] || { min: 6, max: 15 };

            if (!v) {
                return { id: 'phone.required', defaultMessage: 'Phone number is required' };
            }

            if (len < limits.min) {
                return {
                    id: 'phone.tooShortForCountry',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (len > limits.max) {
                return {
                    id: 'phone.tooLongForCountry',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (limits.pattern && !limits.pattern.test(`${countryCode}${v}`)) {
                return {
                    id: 'phone.invalid',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (!limits.pattern && !/^\d+$/.test(v)) {
                return { id: 'phone.required', defaultMessage: 'Please enter a valid phone number.' };
            }

            return undefined;
        },
        [initialCountry]
    );

    const handleUsePhone = () => {
        if (typeof handleViewMode === 'function') handleViewMode('email');
    };

    // 把可能返回字符串的 isRequired 包装为 descriptor
    const wrappedIsRequired = useCallback(
        value => {
            const res = isRequired(value);
            if (!res) return undefined;
            return typeof res === 'string' ? { id: 'phone.required', defaultMessage: res } : res;
        },
        []
    );

    const combinedPhoneValidator = useMemo(
        () => combine([wrappedIsRequired, phoneValidator]),
        [wrappedIsRequired, phoneValidator]
    );


    const handleLogin = async (values) => {
        if (phoneErrorMessage) return

        setIsLoading(true)
        const phoneRaw = values?.phone;
        const payload = { country: country.value, phone: normalizePhone(phoneRaw) };
        setPendingPayload(payload);

        const phoneNumber = `${payload.country}${payload.phone}`

        // 检查是否有密码
        const checkPhoneNumberRes = await handleCheckPhoneNumber(phoneNumber)
        setIshasLoginPasswordFlag(checkPhoneNumberRes)

        // api error return undefined
        if(checkPhoneNumberRes === undefined) {
            setIsLoading(false)
            return
        }


        // 如果有密码则直接进入登录流程，否则进入验证码流程
        if (checkPhoneNumberRes) {
            setFormType(FormTypeMap.PASSWORD_LOGIN)
            setIsLoading(false)
            return
        }

        await handleLoginRadiusSmsEnabled()
        setIsLoading(false)

        setShowVerificationModal(true);
    }

    // 输入密码登录
    const handlePasswordLogin = async (values) => {
        try {
            setIsLoading(true)
            const { phone, country } = pendingPayload || {}
            const phoneNumber = `${country}${phone}`
            const res = await handleLoginByPhoneAndPassword({ phoneNumber, password: values.password })
            const data = res?.data?.loginByPhoneAndPassword || {}
            const { message, status, next_step, lr_data } = data

            if (status === VerifyStatus.SUCCESS) {
                if (lr_data) {
                    const { dob, phone_number, ...other } = lr_data?.profile || {}
                    setInitialInfoData({ ...other, date_of_birth: dob, phonenumber: /^\+\s*\d+/.test(phone_number) ? phone_number : `+${phone_number}` })
                    setAccountInfo(lr_data)
                    const { access_token, expires_in, refresh_token } = lr_data || {}
                    setAccessToken(access_token, expires_in)
                    setRefreshToken(refresh_token)
                }
                if (next_step === AuthNextStep.BIND_PHONE) {
                    setPhoneErrorMessage('')
                    setShowBindPhoneNumberModal(true)
                } else if (next_step === AuthNextStep.COMPLETE_PROFILE || next_step === AuthNextStep.SIGN_UP) {
                    setPhoneErrorMessage('')
                    setShowSignUpModal(true)
                }

            } else {
                showInfo(message)
            }
        } catch (error) {
            console.log(error);
            // 在 password 输入框下展示内联错误
            const formApi = formApiRef.current;
            if (formApi && typeof formApi.setError === 'function') {
                formApi.setError('password', {
                    id: 'signIn.password.error',
                    defaultMessage: error.message || 'Incorrect password'
                });
            }
        } finally {
            setIsLoading(false);

        }
    }

    const handleForgotPassword = async () => {
        setIsGobalLoading(true)
        try {
            // 获取当前表单中的手机号
            const phoneRaw = pendingPayload?.phone
            if (!phoneRaw) {
                showInfo('Please enter your phone number first')
                setIsGobalLoading(false)
                return
            }

            const phoneNumber = `${country.value}${normalizePhone(phoneRaw)}`
            const payload = { country: country.value, phone: normalizePhone(phoneRaw) };
            setPendingPayload(payload);

            const res = await handleRequestResetPasswordApi({ phoneNumber })
            const { message, next_step, status, email } = res?.data?.requestResetPassword || res || {}
            if (status) {
                if (next_step === AuthNextStep.OTP_METHOD) {

                    await handleLoginRadiusSmsEnabled()
                    setShowVerificationModal(true);
                    setFormType(FormTypeMap.FORGET_PASSWORD)
                } else if (next_step === null && email) {
                    history.push(`/forgot-password?email=${email}`)
                } else {
                    showInfo(message)
                }
            } else {
                showInfo(message || 'Request failed')
            }
        } catch (error) {
            showInfo(error.message)
        } finally {
            setIsGobalLoading(false)
        }

    }

    const handleCreatePassword = async (values) => {
        const access_token = await getAccessToken()
        const { phone, country } = pendingPayload || {};
        const phoneNumber = `${country}${phone}`
        const password = values.password

        try {
            setIsLoading(true);
            const res = await handleAddPhonePasswordApi({
                phone: phoneNumber,
                password,
                accessToken: access_token,
                prevStep
            })
            const data = res?.data || {}
            const { next_step, token, lr_data, message, status } = data.addPhonePassword || {}

            setCurrentNextStep(next_step)
            if (next_step === AuthNextStep.SIGN_UP || next_step === AuthNextStep.COMPLETE_PROFILE) { // 注册补全信息
                setShowVerifyCodeModal(false);
                if (lr_data?.profile) {
                    const { dob, phone_number, ...other } = lr_data?.profile || {}

                    setInitialInfoData({ ...other, date_of_birth: dob, phonenumber: phone_number })
                    setAccountInfo(lr_data)
                    const { access_token, expires_in, refresh_token } = lr_data || {}
                    setAccessToken(access_token, expires_in)
                    setRefreshToken(refresh_token)
                }
                setShowSignUpModal(true);
            }

            if(status === VerifyStatus.SUCCESS && next_step === AuthNextStep.CHANGE_PASSWORD_SUCCESS) {
                showSuccess(message)
                setTimeout(() => {
                    history.push('/')
                }, 1000)
            }
        } catch (error) {
            showInfo(error.message)
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = useCallback(async values => {
        switch (formType) {
            case FormTypeMap.LOGIN:
                // 登录/注册
                await handleLogin(values)
                break;
            case FormTypeMap.PASSWORD_LOGIN:
                // 密码登录
                await handlePasswordLogin(values)
                break;
            case FormTypeMap.FORGET_PASSWORD:
                // 忘记密码——此时用户已验证 OTP，需要设置新密码
                await handleCreatePassword(values)
                break;
            case FormTypeMap.CREATE_PASSWORD:
                // 创建密码
                await handleCreatePassword(values)
                break;
            default:
                // 登录/注册
                await handleLogin(values)
                break;
        }
    });

    // 获取登录短信服务是否启用
    const handleLoginRadiusSmsEnabled = async () => {
        const login_radius_sms_enabled = await handleStoreConfig()
        setLoginRadiusSmsEnabled(login_radius_sms_enabled)
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
            setIsLoading(true)
            const result = await handleRequestPhoneOTPApi({ method, phoneId })
            setIsLoading(false)
            const { requestPhoneOTP } = result?.data || {}
            const { message, success } = requestPhoneOTP || {}
            if (success) {
                showSuccess(message)
                return { ...result, status: true }
            } else {
                showInfo(message)
                setPhoneErrorMessage(message)
                return false
            }
        } catch (error) {
            setIsLoading(false)
            setPhoneErrorMessage(error.message)
            return false
        }
    }

    // 忘记密码流程：请求发送 OTP 验证码（使用忘记密码专用的 API）
    const handleRequestForgotPasswordOtp = async ({ method, phoneId }) => {
        if (!phoneId) return false
        try {
            setIsLoading(true)
            const result = await handleRequestForgotPasswordOtpApi({ phoneNumber: phoneId, method })
            setIsLoading(false)
            const { requestForgotPasswordOtp } = result?.data || {}
            const { message, success } = requestForgotPasswordOtp || {}
            if (success) {
                showSuccess(message)
                return true
            } else {
                showInfo(message)
                return false
            }
        } catch (error) {
            setIsLoading(false)
            showInfo(error.message)
            return false
        }
    }

    // VerifyCodeModal 重新发送验证码回调，根据当前流程分发
    const handleResendOtp = async ({ method, phoneId }) => {
        if (!phoneId) return
        let success = false
        let message = ''
        if (formType === FormTypeMap.FORGET_PASSWORD) {
            const result = await handleRequestForgotPasswordOtp({ method, phoneId })
            const res = result?.data || {}
            success = res?.requestForgotPasswordOtp?.success || false
            message = res?.requestForgotPasswordOtp?.message || ''
        } else {
            const result = await handleRequestSendPhoneOTPApi({ method, phoneId })
            const { requestPhoneOTP } = result?.data || {}
            message = requestPhoneOTP?.message || ''
            success = requestPhoneOTP?.success || false
        }

        if (success) {
                showSuccess(message)
            return { status: true, message }
        } else {
                showInfo(message)
            return { status: false, message }
        }
    }

    const PhoneHint = () => {
        if (phoneErrorMessage) {
            return (
                <div className={[localClasses.hintTextStyle, !isPhone ? localClasses.errorText : ''].join(' ')} style={{ marginLeft: 100, color: '#CC2B1E' }}>
                    {isPhone ? (<Info size={12} style={{ marginRight: 4 }} />) : null}
                    {phoneErrorMessage}
                </div>
            );
        }
        return null
    }

    const handleModalSuccess = async ({ method, phoneId }) => {
        if (!pendingPayload) return;

        setShowVerificationModal(false);
        let isSuccess = false;
        if (formType === FormTypeMap.FORGET_PASSWORD) {
            // 忘记密码流程：使用忘记密码专用的发送 OTP API
            isSuccess = await handleRequestForgotPasswordOtp({ method, phoneId })
        } else {
            // 普通登录/注册流程：使用原来的
            const result = await handleRequestSendPhoneOTPApi({ method, phoneId })
            isSuccess = Boolean(result?.status)
        }
        if (!isSuccess) return

        setSendCodeMethod(method)
        handleVerificationMethodSuccess()
    };




    // VerifyCodeModal 的确认回调（输入 OTP 后）
    const handleConfirmCode = async ({ payload, code }) => {
        if (!payload.phone || !code) return;

        try {
            const { phone, country } = payload;
            const phoneNumber = `${country}${phone}`

            if (formType === FormTypeMap.FORGET_PASSWORD) {
                // 忘记密码流程：验证 OTP
                const result = await handleVerifyForgotPasswordOtpApi({ phoneNumber, otp: code })
                const data = result?.data?.verifyForgotPasswordOtp || {}
                const { next_step, status, lr_data, message } = data

                if (status === VerifyStatus.SUCCESS && next_step === AuthNextStep.CREATE_PASSWORD) {
                    // 需要设置新密码：存储 lr_data 中的 token 用于后续添加密码
                    const { access_token, expires_in, refresh_token } = lr_data || {}
                    if (access_token) {
                        setAccessToken(access_token, expires_in)
                    }
                    if (refresh_token) {
                        setRefreshToken(refresh_token)
                    }
                    // 设置 prev_step 供 handleCreatePassword 使用
                    setPrevStep(next_step)
                    setShowVerifyCodeModal(false);
                    //  CREATE_PASSWORD 状态以显示创建密码表单
                    setFormType(FormTypeMap.CREATE_PASSWORD)

                    return true
                } else {
                    showInfo(message || 'Verification failed')
                    return false
                }
            } else {
                // 原有的普通验证码登录/注册流程
                const res = await handleVerifyPhoneOTPApi({ phoneId: phoneNumber, otp: code })

                const data = res?.data || {}
                const { next_step, token, lr_data, message, status } = data.verifyPhoneOTP || {}
                const { OTP_INVALID, OTP_EXPIRED, TOO_MANY_ATTEMPTS } = VerifyStatus

                setCurrentNextStep(next_step)
                if (next_step === AuthNextStep.ADD_PASSWORD) { // 创建密码
                    setShowVerifyCodeModal(false);
                    // 设置 prev_step 供 handleCreatePassword 使用
                    setPrevStep(next_step)
                    if (lr_data?.profile) {
                        const { dob, phone_number, ...other } = lr_data?.profile || {}

                        setInitialInfoData({ ...other, date_of_birth: dob, phonenumber: phone_number })
                        setAccountInfo(lr_data)
                        const { access_token, expires_in, refresh_token } = lr_data || {}
                        setAccessToken(access_token, expires_in)
                        setRefreshToken(refresh_token)
                    }
                    setFormType(FormTypeMap.CREATE_PASSWORD)
                    return true
                } else if (next_step === AuthNextStep.SIGN_UP || next_step === AuthNextStep.COMPLETE_PROFILE) { // 注册补全信息
                    setShowVerifyCodeModal(false);
                    if (lr_data?.profile) {
                        const { dob, phone_number, ...other } = lr_data?.profile || {}

                        setInitialInfoData({ ...other, date_of_birth: dob, phonenumber: phone_number })
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
            }
        } catch (error) {
            console.log('error', error)
            showInfo(error.message)
        } finally {
        }
    };



    const handdleSignUpModalFormSubmit = async (formData) => {
        // 合并手机验证数据和注册表单数据

        // const { access_token } = accountInfo || {}
        const access_token = await getAccessToken()
        const infoData = {
            email: formData.email,
            firstname: formData.firstname,
            lastname: formData.lastname,
            date_of_birth: formData.date_of_birth,
            access_token,
            phonenumber: formData.phonenumber
        };

        if (formData.gender) {
            infoData.gender = formData.gender
        }
        // try {
            if (currentNextStep === AuthNextStep.COMPLETE_PROFILE) {
                const res = await handleUpdateCustomerInformationApi(infoData)

                return res?.data?.updateCustomerCustom || {}
            } else {
                const res = await handleCreateAccountMutationApi({ ...infoData, is_subscribed: true })
                return res?.data?.createCustomerCustom || {}
            }
        // } catch (error) {
        //     showInfo(error.message)
        //     return error
        // }
    }

    const handelChangePhone = (event) => {
        const phone = event?.target?.value || ''
        if (/^(8[1-9][0-9]{7,10})$/.test(phone)) {
            setShowErrorMsg(false)
        } else {
            setShowErrorMsg(true)
        }
        setPhoneErrorMessage('')
    }

    // 登录表单
    const loginForm =
        <Field
            isRequired={true}
            label={formatMessage({
                id: 'phone.number',
                defaultMessage: 'Phone Number'
            })}
        >
            <div className={localClasses.phoneRow}>
                <div className={localClasses.countrySelectWrapper}>
                    <Select
                        className='phoneSignInSelect'
                        options={countryOptions}
                        value={country}
                        onChange={setCountry}
                        isSearchable={false}
                        styles={{
                            control: (provided) => ({
                                ...provided,
                                minHeight: '44px',
                                borderRadius: 6,
                                borderWidth: 1.3,
                                borderColor: '#CCCAC6',
                                boxShadow: 'none',
                                backgroundColor: '#FAFAFA'
                            }),
                            singleValue: (provided) => ({
                                ...provided,
                                fontSize: 14
                            }),
                            menu: (provided) => ({ ...provided, zIndex: 9999 })
                        }}
                    />
                </div>

                <div className={localClasses.phoneInputWrapper}>
                    <TextInput
                        className={localClasses.phoneInput}
                        style={Boolean(phoneErrorMessage) ? { border: '1.3px solid #f87171', height: 44 } : { height: 44 }}
                        field="phone"
                        inputMode="numeric"
                        onKeyPress={(e) => {
                            if (!/\d/.test(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onChange={(e) => handelChangePhone(e)}
                        placeholder={formatMessage({ id: 'phone.placeholder', defaultMessage: 'Enter your Phone Number' })}
                        validate={phoneValidator}
                        validateOnBlur
                        mask={v => v && v.trim()}
                        maskOnBlur
                    />
                </div>
            </div>
            <PhoneHint />
        </Field>

    // 注册时创建登录密码的表单
    const createLoginPasswordForm =
        <>
            <Password
                isRequired={true}
                fieldName="password"
                label={formatMessage({
                    id: 'signIn.password',
                    defaultMessage: 'Password'
                })}
                style={{ color: '#373737' }}
                validate={combine([
                    isRequired,
                    validatePassword,
                    [hasLengthAtLeast, 8]
                ])}
                validateOnBlur
                placeholder={formatMessage({
                    id: 'signIn.passwordPlaceholder',
                    defaultMessage: 'Enter your Password'
                })}
                autoComplete="password"
                isToggleButtonHidden={false}
            />

            <Password
                isRequired={true}
                fieldName="Confirm Password"
                label={formatMessage({
                    id: 'signIn.confirmPassword',
                    defaultMessage: 'Confirm Password'
                })}
                style={{ color: '#373737' }}
                validate={(value, values) => isEqualToField(value, values, "password")}
                validateOnBlur
                placeholder={formatMessage({
                    id: 'signIn.confirmPasswordPlaceholder',
                    defaultMessage: 'Enter your Password'
                })}
                autoComplete="confirm-password"
                isToggleButtonHidden={false}
            />
        </>

    // 已有登录密码用户的登录表单
    const usePasswordLoginForm =
        <>
            <div className={localClasses.phoneNumberText}>Phone Number</div>
            <div className={localClasses.phoneNumberValue}>（{pendingPayload.country}）{pendingPayload.phone}</div>
            <Password
                isRequired={true}
                fieldName="password"
                label={formatMessage({
                    id: 'signIn.Password',
                    defaultMessage: 'Password'
                })}
                style={{ color: '#373737' }}
                validate={combine([
                    isRequired,
                    validatePassword,
                    [hasLengthAtLeast, 8]
                ])}
                validateOnBlur
                placeholder={formatMessage({
                    id: 'signIn.currentPasswordPlaceholder',
                    defaultMessage: 'Enter your Password'
                })}
                autoComplete="password"
                isToggleButtonHidden={false}
            />
        </>

    // 忘记密码表单（仅输入手机号，后续流程与登录相同）
    const forgetPasswordForm = createLoginPasswordForm

    const formModalTemplate = useCallback(() => {
        switch (formType) {
            case FormTypeMap.LOGIN:
                return loginForm
            case FormTypeMap.CREATE_PASSWORD:
                return createLoginPasswordForm
            case FormTypeMap.PASSWORD_LOGIN:
                return usePasswordLoginForm
            case FormTypeMap.FORGET_PASSWORD:
                return usePasswordLoginForm
            default:
                return loginForm
        }
    }, [formType, loginForm, createLoginPasswordForm, usePasswordLoginForm, forgetPasswordForm])





    return (
        <div className={localClasses.root}>

            <div className={showSignUpModal ? localClasses.hideWhenSignUpOpen : ''}>
                <div className={classes.header} >
                    {/* <FormattedMessage
                                        id="signInPage.header2"
                                        defaultMessage="Customer Login"
                                    /> */}
                    {formType !== FormTypeMap.LOGIN && <button
                        onClick={() => setFormType(FormTypeMap.LOGIN)}
                        aria-label="close"
                        className={localClasses.closeButton}
                    >
                        <ChevronLeft size={32} color='#212121' />
                    </button>}
                    <div>

                        <div className={classes.headerText}>{[FormTypeMap.ADD_PASSWORD, FormTypeMap.CREATE_PASSWORD].includes(formType) ? 'CREATE NEW PASSWORD' : 'LOGIN/REGISTER'}</div>
                        <div className={[classes.headerTipText, formType === FormTypeMap.CREATE_PASSWORD ? classes.headerTipTextPadding : ''].join(' ')} >Please enter your account information below to {formType === FormTypeMap.PASSWORD_LOGIN ? 'Login' : 'Login/Register'}!</div>
                    </div>
                </div>

                <Form getApi={setFormApi} className={classes.form} onSubmit={handleSubmit}>
                    {/* {showCreateLoginPassword ? createLoginPasswordForm : loginForm} */}
                    {formModalTemplate()}
                    <div className={classes.buttonsContainer}>
                        <div className={`${classes.buttonWrapper} ${localClasses.fullWidthButtonWrapper}`}>
                            <Button
                                priority="high"
                                type="submit"
                                disabled={isLoading || showErrorMsg}
                                className={classes.buttonsSignIn}
                            >
                                {isLoading && <Loader size={14} color="#fff" />}
                                <FormattedMessage id="phone.next" defaultMessage={formType === FormTypeMap.LOGIN ? 'LOGIN/REGISTER' : 'NEXT'} />
                            </Button>
                        </div>
                    </div>
                </Form>

                {(formType === FormTypeMap.PASSWORD_LOGIN || formType === FormTypeMap.FORGET_PASSWORD) && <div className={classes.forgotPasswordButtonContainer}>
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
                </div>}

                <div className={localClasses.divider}>
                    <div className={localClasses.dividerLine} />
                    <div className={localClasses.dividerText}>OR</div>
                    <div className={localClasses.dividerLine} />
                </div>

                <div className={localClasses.emailBlock}>
                    <div className={localClasses.emailText}>
                        {formatMessage({ id: 'phone.haveEmail', defaultMessage: 'If you already have an email account.' })}
                    </div>
                    <div className={localClasses.emailButtonWrapper}>
                        <Button
                            priority="low"
                            type="button"
                            className={classes.buttonsCreateAccount}
                            onClick={handleUsePhone}
                            classes={{ root_normalPriority: localClasses.emailButton }}
                        >
                            <FormattedMessage id="phone.signInWithEmail" defaultMessage="Login with Email" />
                        </Button>
                    </div>
                </div>
            </div>

            {isGobalLoading && <LoadingIndicator global={true} />}


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
                method={sendCodeMethod}
                onConfirm={handleConfirmCode}
                onResend={handleResendOtp}
                onClose={() => { setShowVerifyCodeModal(false) }}
            />

            <SignUpModal
                open={showSignUpModal}
                onNext={handdleSignUpModalFormSubmit}
                initialCountry={pendingPayload.country}
                onClose={() => {
                    setShowSignUpModal(false);
                }}
                initialData={initialInfoData}
            />
        </div>
    );
};

PhoneSignInInformed.propTypes = {
    onNext: PropTypes.func,
    talonProps: PropTypes.shape({
        handleForgotPassword: PropTypes.func,
        handleSubmit: PropTypes.func,
        handleSubmitOtp: PropTypes.func,
        otpConfig: PropTypes.object,
        isBusy: PropTypes.bool,
        setFormApi: PropTypes.func,
        handleSignIn: PropTypes.func,
        handleRequestPhoneOTPApi: PropTypes.func,
        handleVerifyPhoneOTPApi: PropTypes.func,
        getCustomerHobbies: PropTypes.any,
        handleCreateAccountMutationApi: PropTypes.func,
        AuthNextStep: PropTypes.object,
        VerifyStatus: PropTypes.object
    }),
    initialCountry: PropTypes.string,
    handleViewMode: PropTypes.func,
    classes: PropTypes.object
};

export default PhoneSignInInformed;
