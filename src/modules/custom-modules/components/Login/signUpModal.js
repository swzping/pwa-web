import React, { useState, useEffect, useCallback, forwardRef, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Calendar, X as Close } from 'react-feather';
import { Form, useFormApi } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import Field, { Message } from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import RadioGroup from '@magento/venia-ui/lib/components/RadioGroup';
import Toast, { useToastState, useToast } from '../Common/Toast';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import VerifyEmailCodeModal from './verifyEmailCodeModal';
import VerifyPhoneCodeModal from './verifyPhoneCodeModal';
import RegistrationSuccessfulModal from './registrationSuccessfulModal';
import VerificationMethodModal from './VerificationMethodModal';
import ReturnBackConfirmModal from './returnBackConfirmModal'
import signInClasses from '@magento/venia-ui/lib/components/SignIn/signIn.module.css';
import defaultClasses from './signUpModal.module.css'
import { useStyle } from '@magento/venia-ui/lib/classify';
import { Info, CheckCircle, Loader } from 'react-feather';
import HobbiesModal from './hobbiesModal'
import { useHistory } from 'react-router-dom';
import Select from 'react-select';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import DEFAULT_OPERATIONS from '../../../../overrides/peregrine/talons/SignIn/signIn.gql'
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import Button from '@magento/venia-ui/lib/components/Button';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import { useSignIn, useSignInCommon } from '../../../../overrides/peregrine/talons/SignIn/useSignIn'
import { useGoogleReCaptcha } from '@magento/peregrine/lib/hooks/useGoogleReCaptcha';
import useFieldState from '@magento/peregrine/lib/hooks/hook-wrappers/useInformedFieldStateWrapper';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import { registerSuccessTracking } from '@/lib/ThirdPartyTracking';
import { getDeviceType } from '@/helpers/tools'
import './phoneSignIn.css'

const DEFAULT_COUNTRIES = [
    { code: '+62', label: '+62' },
    // { code: '+86', label: '+86' },
    // { code: '+1', label: '+1' },
    // { code: '+44', label: '+44' }
];

// 每个国家本地号码常见长度（示例，可按需扩展）
const localLengthMap = {
    '+62': { min: 9, max: 12, pattern: /^\+628[1-9]\d{7,10}$/ }, // Indonesia
    '+86': { min: 11, max: 11, pattern: /^1[3-9]\d{9}$/ }, // China
    '+1': { min: 10, max: 10 }, // US
    '+44': { min: 9, max: 10 } // UK (部分为9或10)
};

const normalizePhone = v => (v || '').replace(/[^\d]/g, '');

const storage = new BrowserPersistence();

/**
 * Sign Up Modal Component
 *
 * props:
 * - open: boolean
 * - onNext: (formData) => Promise
 * - signUpType : 'phone' | 'email' (默认 'phone') | personalInfo
 * - onClose: () => void
 * - initialData: object (可选，用于预填充表单)
 */
const SignUpModal = ({ open, onNext, onClose, signUpType = 'phone', initialCountry = '+62', classesProp = {}, initialData = {} }) => {
    const [{ }, { getRedirect }] = useUserContext();
    const classes = useStyle(defaultClasses, signInClasses, classesProp);
    const { getAccessToken, handleStoreConfig } = useSignInCommon()
    const history = useHistory()
    const isPhoneSignUp = signUpType === 'phone'
    const isPersonalInfo = signUpType === 'personalInfo'
    const isEmailSignUp = signUpType === 'email'
    const formApiRef = useRef(null);
    const { formatMessage } = useIntl();
    const [emailVerified, setEmailVerified] = useState(Boolean(initialData.email));
    const [isHasValidEmail, setIsHasValidEmail] = useState(Boolean(initialData.email) || false);
    const [agreedToTerms, setAgreedToTerms] = useState(null);
    const [busy, setBusy] = useState(false);
    const { showError, showInfo, showSuccess } = useToast();
    const [verifiedEmailAddress, setVerifiedEmailAddress] = useState(new Set([]))
    const [emailErrorMessage, setEmailErrorMessage] = useState('');
    const [isVerifiedEmailLoading, setIsVerifiedEmailLoading] = useState(false);
    const [phoneErrorMessage, setPhoneErrorMessage] = useState('');
    const [isVerifiedPhoneLoading, setIsVerifiedPhoneLoading] = useState(false);
    const [isEmailChangedFlag, setIsEmailChangedFlag] = useState(false)
    const [isPhoneChangedFlag, setIsPhoneChangedFlag] = useState(false);
    const [loginRadiusSmsEnabled, setLoginRadiusSmsEnabled] = useState(false);

    const [selectedDate, setSelectedDate] = useState(
        initialData.date_of_birth ? new Date(initialData.date_of_birth) : null
    );
    const [sendCodeMethod, setSendCodeMethod] = useState(''); // 选中获取手机号的方式

    // 计算17年前的日期（用于最大日期限制）
    const getMaxDateFor17YearsOld = () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 17);
        return date;
    };

    // Verify email modal state
    const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
    const [verifyEmailAddress, setVerifyEmailAddress] = useState(initialData.email || null);

    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [requestPhoneOTPApi, { error: requestPhoneOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestPhoneOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [bindPhoneNumberApi, { error: bindPhoneNumberError }] = useMutation(
        DEFAULT_OPERATIONS.bindPhoneNumberV2,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [requestEmailOTPApi, { error: requestEmailOTPError }] = useMutation(
        DEFAULT_OPERATIONS.requestEmailOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [verifyPhoneOTP, { error: verifyPhoneOTPError }] = useMutation(
        DEFAULT_OPERATIONS.verifyPhoneOTPV2,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [verifyEmailOTP, { error: verifyEmailOTPError }] = useMutation(
        DEFAULT_OPERATIONS.verifyEmailOTP,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [saveCustomerHobbies, { error: saveCustomerHobbiesError }] = useMutation(
        DEFAULT_OPERATIONS.saveCustomerHobbies,
        {
            fetchPolicy: 'no-cache'
        }
    );

    // 登录流程 reCAPTCHA：requestPhoneOTP / bindPhoneNumberV2 / verifyPhoneOTPV2（formAction 全页唯一）
    const {
        generateReCaptchaData: generateSignUpModalReCaptchaData
    } = useGoogleReCaptcha({
        currentForm: 'CUSTOMER_LOGIN',
        formAction: 'signUpModalPhone',
    });


    // Registration Successful modal state
    const [points, setPoints] = useState(0);
    const [showRegistrationSuccessfulModal, setShowRegistrationSuccessfulModal] = useState(false);


    // Hobbies modal state
    const [showHobbiesModal, setShowHobbiesModal] = useState(false);
    const [hobbiesCategories, setHobbiesCategories] = useState([]);
    const [hobbies, setHobbies] = useState([]);

    const [phoneVerified, setPhoneVerified] = useState(Boolean(initialData.phone) || null);
    const [isHasValidPhone, setIsHasValidPhone] = useState(Boolean(initialData.phone) || false);
    const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState(new Set([]))

    // Verification modal state
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState({});

    const [showVerifyPhoneModal, setShowVerifyPhoneModal] = useState(false);
    const [verifyPhoneNumber, setVerifyPhoneNumber] = useState(null);

    // return back confirm modal state
    const [showReturnBackConfirmModal, setShowReturnBackConfirmModal] = useState(false);


    // react-select 使用 { value, label } 形式的 option
    const countryOptions = useMemo(
        () => DEFAULT_COUNTRIES.map(c => ({ value: c.code, label: c.label })),
        []
    );
    const [country, setCountry] = useState(
        () => countryOptions.find(o => o.value === initialCountry) || countryOptions[0]
    );
    const countryRef = useRef(country);

    useEffect(() => {
        countryRef.current = country;
    }, [country]);

    const { data: gednerOptions } = useQuery(DEFAULT_OPERATIONS.getGednerOptions, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !open,
    });


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


    const handleClose = () => {
        setShowReturnBackConfirmModal(false)
        showInfo('Sign-in/Sign-up Unsuccessful.')
        onClose && onClose()
    }

    const handleSendEmailOTP = async ({ email }) => {
        if (isVerifiedEmailLoading) return false;

        const emailStatusMap = {
            SENT_VERIFIED_EMAIL: 'SENT_VERIFIED_EMAIL',
            VERIFIED_SUCCESS: 'VERIFIED_SUCCESS',
            VERIFIED_ERROR: 'VERIFIED_ERROR',
        }

        const access_token = await getAccessToken()

        try {
            setIsVerifiedEmailLoading(true)
            const res = await requestEmailOTPApi({
                variables: { email, accessToken: access_token }
            })
            setIsVerifiedEmailLoading(false)
            const { status, message } = res?.data?.verifyEmail || {}
            if (status === emailStatusMap.VERIFIED_SUCCESS) {
                setVerifiedEmailAddress(new Set([email]))
                setShowVerifyEmailModal(false);
                setEmailVerified(true);
                showSuccess(message)
                return false
            } else if (status === emailStatusMap.SENT_VERIFIED_EMAIL) {
                showSuccess(message)
                return true
            } else if (status === emailStatusMap.VERIFIED_ERROR) {
                // showInfo(message)
                setEmailErrorMessage(message)
                return false
            } else {
                showInfo(message)
                return false
            }
        } catch (error) {
            setIsVerifiedEmailLoading(false)
            setEmailErrorMessage(error.message)
            return false
        }
    }

    // 根据当前选择的国家校验手机号，返回 formatjs message descriptor 或 undefined
    const phoneValidator = useCallback(
        value => {
            const v = value;

            const len = v?.length;
            const countryCode = (countryRef.current && countryRef.current.value) || initialCountry || '+62';
            const limits = localLengthMap[countryCode] || { min: 6, max: 15 };

            if (!v) {
                setIsHasValidPhone(false)
                setPhoneVerified(false)
                return { id: 'phone.required', defaultMessage: 'Phone number is required' };
            }

            if (len < limits.min) {
                setIsHasValidPhone(false)
                setPhoneVerified(false)

                return {
                    id: 'phone.tooShortForCountry',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (len > limits.max) {
                setIsHasValidPhone(false)
                setPhoneVerified(false)

                return {
                    id: 'phone.tooLongForCountry',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (limits.pattern && !limits.pattern.test(`${countryCode}${v}`)) {
                setIsHasValidPhone(false)
                setPhoneVerified(false)
                return {
                    id: 'phone.invalid',
                    defaultMessage: `Please enter a valid phone number.`
                };
            }

            if (!limits.pattern && !/^\d+$/.test(v)) {
                setIsHasValidPhone(false)
                setPhoneVerified(false)
                return { id: 'phone.required', defaultMessage: 'Please enter a valid phone number.' };
            }

            setIsHasValidPhone(true)

            return undefined;
        },
        []
    );

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

    const handleVerifyPhone = async () => {
        const formApi = formApiRef.current;
        const phoneValue = formApi && typeof formApi.getValue === 'function' ? formApi.getValue('phone') : null;
        const payload = { country: country.value, phone: normalizePhone(phoneValue) };

        setIsVerifiedPhoneLoading(true)
        await handleLoginRadiusSmsEnabled()
        setIsVerifiedPhoneLoading(false)

        setPendingPayload(payload);
        setShowVerificationModal(true);
    }


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
            setVerifyPhoneNumber(pendingPayload.phone);
            setShowVerifyPhoneModal(true)
        } else {
        }
    };

    const handleRequestSendPhoneOTPApi = async ({ phoneId, method }) => {
        if (!phoneId || isVerifiedPhoneLoading) return false

        try {
            setIsVerifiedPhoneLoading(true)

            const recaptchaData = await generateSignUpModalReCaptchaData();
            const result = await bindPhoneNumberApi({
                variables: { method, phoneId, access_token: '' },
                ...recaptchaData
            })
            setIsVerifiedPhoneLoading(false)

            const { bindPhoneNumberV2 } = result?.data || {}
            const { message, success } = bindPhoneNumberV2 || {}
            if (success) {
                showSuccess(message)
                return true
            } else {
                // showInfo(message)
                setPhoneErrorMessage(message)
                return false
            }
        } catch (error) {
            console.log(error.message);
            setIsVerifiedPhoneLoading(false)
            setPhoneErrorMessage(error.message)
            return false
        }
    }

    // modal 成功回调：接收 { method, phoneId }
    const handleModalSuccess = async ({ method, phoneId }) => {
        const isSuccess = await handleRequestSendPhoneOTPApi({ method, phoneId })
        if (!isSuccess) return

        setSendCodeMethod(method)
        setShowVerificationModal(false);
        handleVerificationMethodSuccess()
    };

    useEffect(() => {
        if (open) {
            // 重置表单状态
            initEmail()
            initPhone()
            setAgreedToTerms(null);
            setHobbies(initialData.hobbies)
        } else {
            resetFormdata()
        }
    }, [open, initialData]);

    const initEmail = () => {
        setIsEmailChangedFlag(false)
        setEmailVerified(!!initialData.email);
        setIsHasValidEmail(!!initialData.email)
        setVerifyEmailAddress(initialData.email)
        initialData.email ? verifiedEmailAddress.add(initialData.email) : setVerifiedEmailAddress(new Set([]))
    }

    const initPhone = () => {
        setIsPhoneChangedFlag(false)
        setIsHasValidPhone(!!initialData.phone)
        setPhoneVerified(!!initialData.phone);
        setVerifyPhoneNumber(initialData.phone)
        if (initialData.phone) {
            const payload = { country: country.value, phone: initialData.phone };
            setPendingPayload(payload)
        }
        initialData.phone ? verifiedPhoneNumber.add(`${country.value}${initialData.phone}`) : setVerifiedPhoneNumber(new Set([]))
    }

    const resetFormdata = () => {
        const formApi = formApiRef?.current;
        const fields = ['date_of_birth']
        fields.forEach(field => {
            if (formApi && typeof formApi.getValue === 'function' && typeof formApi.setValue === 'function') {
                const current = formApi.getValue(field);
                if (current) formApi.setValue(field, '');
            }
        })
        setSelectedDate(null)
    }


    // 日期格式化函数
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // helper: 格式化 Date 或可解析日期为 "YYYY-MM-DD"
    function formatDateToYMD(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 自定义日期输入组件
    const CustomDateInput = forwardRef(({ value, onClick, placeholder, disabled, isValid }, ref) => {
        return (
            <div className={defaultClasses.dateInputWrapperStyle}>
                <input
                    ref={ref}
                    type="text"
                    value={value || ''}
                    onClick={onClick}
                    readOnly
                    disabled={disabled}
                    placeholder={placeholder || 'Day/Month / Year'}
                    style={{ border: isValid === false ? '1.3px solid #f87171' : 'none' }}
                    className={disabled ? defaultClasses.dateInputDisabledStyle : defaultClasses.dateInputStyle}
                />
                <Calendar size={16} className={defaultClasses.calendarIconStyle} onClick={onClick} />
            </div>
        );
    });

    CustomDateInput.displayName = 'CustomDateInput';

    // 日期选择器组件（与 informed 集成）
    const DatePickerField = ({ field, initialValue, maxDate, disabled, ...props }) => {
        const formApi = useFormApi();

        const [isOpen, setIsOpen] = useState(false);
        const fieldState = useFieldState(field);
        const errorMessage = fieldState.error;


        useEffect(() => {
            if (initialValue) {
                const date = new Date(initialValue);
                if (selectedDate?.getTime?.() == date?.getTime?.()) return
                setSelectedDate(date);
                // 使用 formApi 设置字段值，避免依赖单个 field 是否已注册
                if (formApi && typeof formApi.setValue === 'function') {
                    // formApi.setValue(field, date.toISOString());
                    formApi.setValue(field, formatDateToYMD(date));
                }
            }
        }, [initialValue, formApi, field]);

        const handleDateChange = (date) => {
            setSelectedDate(date);
            if (formApi && typeof formApi.setValue === 'function') {
                if (date) {
                    formApi.setValue(field, date.toISOString());
                } else {
                    formApi.setValue(field, '');
                }
            }
            setIsOpen(false);
        };

        return (
            <>
                <ReactDatePicker
                    style={{ borderColor: 'red' }}
                    selected={selectedDate}
                    onChange={handleDateChange}
                    dateFormat="dd MMMM yyyy"
                    maxDate={maxDate || getMaxDateFor17YearsOld()}
                    showYearDropdown
                    disabled={disabled}
                    showMonthDropdown
                    dropdownMode="select"
                    customInput={<CustomDateInput disabled={disabled} isValid={!errorMessage?.defaultMessage} />}
                    open={isOpen}
                    onClickOutside={() => setIsOpen(false)}
                    onSelect={() => setIsOpen(false)}
                    onInputClick={() => setIsOpen(true)}
                />
                <Message fieldState={fieldState}>{errorMessage}</Message>
            </>

        );
    };

    DatePickerField.propTypes = {
        field: PropTypes.string.isRequired,
        initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        maxDate: PropTypes.instanceOf(Date)
    };

    // 显示 phone hint 的小组件：基于当前表单 phone 字段值决定是否渲染
    const PhoneHint = () => {
        try {

            if (phoneErrorMessage) {
                return (
                    <div className={defaultClasses.hintTextStyle} style={{ color: '#CC2B1E' }}>
                        <Info size={12} style={{ marginRight: 4 }} />
                        {phoneErrorMessage}
                    </div>
                );
            }

            if (isHasValidPhone) {

                if (!phoneVerified) {
                    return (
                        <div className={defaultClasses.hintTextStyle}>
                            <Info size={12} style={{ marginRight: 4 }} />
                            {formatMessage({
                                id: 'signUp.emailHint',
                                defaultMessage: 'You need to verify your Phone Number.'
                            })}
                        </div>
                    );
                } else {
                    if (verifiedPhoneNumber.has(`${pendingPayload.country}${pendingPayload.phone}`)) {
                        if (!isPhoneChangedFlag) return null

                        return (
                            <div className={defaultClasses.hintTextStyle} style={{ color: '#46A147' }}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} />
                                <FormattedMessage
                                    id={'signUpModal.phoneHint'}
                                    defaultMessage={'Verification successful'}
                                />
                            </div>
                        );
                    }

                    return (
                        <div className={defaultClasses.hintTextStyle} style={{ color: '#CC2B1E' }}>
                            <Info size={12} style={{ marginRight: 4 }} />
                            <FormattedMessage
                                id={'signUpModal.phoneHint'}
                                defaultMessage={'Verification failed, please change your Phone Number or try again.'}
                            />
                        </div>
                    );


                }


            } else {
                return null;
            }
        } catch (e) {
            // 如果不在 Form 上下文中则不渲染
            return null;
        }
    };

    // 显示 email hint 的小组件：基于当前表单 email 字段值决定是否渲染
    const EmailHint = () => {
        try {
            if (emailErrorMessage) {
                return (
                    <div className={defaultClasses.hintTextStyle} style={{ color: '#CC2B1E' }}>
                        <Info size={12} style={{ marginRight: 4 }} />
                        {emailErrorMessage}
                    </div>
                );
            }

            if (isHasValidEmail) {
                if (!emailVerified) {
                    return (
                        <div className={defaultClasses.hintTextStyle}>
                            <Info size={12} style={{ marginRight: 4 }} />
                            {formatMessage({
                                id: 'signUp.emailHint',
                                defaultMessage: 'You need to verify your email to successfully make changes.'
                            })}
                        </div>
                    );
                } else {
                    if (verifiedEmailAddress.has(verifyEmailAddress)) {
                        if (!isEmailChangedFlag) return null

                        return (
                            <div className={defaultClasses.hintTextStyle} style={{ color: '#46A147' }}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} />
                                <FormattedMessage
                                    id={'signUpModal.emailHint'}
                                    defaultMessage={'Email verification successful'}
                                />
                            </div>
                        );
                    }

                    return (
                        <div className={defaultClasses.hintTextStyle} style={{ color: '#CC2B1E' }}>
                            <Info size={12} style={{ marginRight: 4 }} />
                            <FormattedMessage
                                id={'signUpModal.emailHint'}
                                defaultMessage={'Email verification failed, please change your email address or try again.'}
                            />
                        </div>
                    );
                }

            } else {
                return null;
            }
        } catch (e) {
            // 如果不在 Form 上下文中则不渲染
            return null;
        }
    };

    // 验证器
    const firstNameValidator = useCallback(
        value => {
            if (!value || !value.trim()) {
                return { id: 'firstname.required', defaultMessage: 'Please enter your first name' };
            }
            return undefined;
        },
        []
    );

    const lastNameValidator = useCallback(
        value => {
            if (!value || !value.trim()) {
                return { id: 'lastname.required', defaultMessage: 'Please enter your last name' };
            }
            return undefined;
        },
        []
    );

    const genderValidator = useCallback(
        value => {
            if (!value) {
                return { id: 'gender.required', defaultMessage: 'Please select your gender' };
            }
            return undefined;
        },
        []
    );

    const emailValidator = useCallback(
        value => {
            // if (!value || !value.trim()) {
            //     return { id: 'email.required', defaultMessage: 'Email is required' };
            // }
            // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            // 只允许 .com、.co.id、.id 三个后缀
            const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@[a-zA-Z0-9\-\.]+\.(?:com|co\.id|id)$/;

            if (value && !emailRegex.test(value)) {
                setIsHasValidEmail(false)
                setEmailVerified(false)
                return { id: 'email.invalid', defaultMessage: 'The email address format seems incorrect, please check it.' };
            }
            if (value && emailRegex.test(value)) {
                setIsHasValidEmail(true)
            }
            return undefined;
        },
        []
    );

    const dateOfBirthValidator = useCallback(
        (value) => {

            if (!value) {
                return { id: 'dob.required', defaultMessage: 'Date of birth is required' };
            }
            const date = new Date(value);
            // 检查是否未来日期
            if (date > new Date()) {
                return { id: 'dob.future', defaultMessage: 'Date of birth cannot be in the future' };
            }
            return undefined;
        },
        []
    );

    const handleVerifyEmail = async () => {
        const formApi = formApiRef.current;
        const emailValue = formApi && typeof formApi.getValue === 'function' ? formApi.getValue('email') : null;
        setVerifyEmailAddress(emailValue)

        const isSuccess = await handleSendEmailOTP({ email: emailValue })
        if (!isSuccess) return

        setShowVerifyEmailModal(true);
    };

    const handleVerifyPhoneOTPApi = async ({ phoneId, otp }) => {
        const recaptchaData = await generateSignUpModalReCaptchaData();
        const res = await verifyPhoneOTP({
            variables: { phoneId, otp },
            ...recaptchaData
        })
        return res
    }

    const handleVerifyEmailOTPApi = async ({ email, otp }) => {
        const res = await verifyEmailOTP({
            variables: { email, otp }
        })

        return res
    }


    const handleConfirmEmailCode = async ({ email, code }) => {
        if (!email || !code) return;
        console.log('email, code', email, code)
        try {
            const res = await handleVerifyEmailOTPApi({ email, otp: code })
            const data = res?.data?.confirmEmailVerification || {}

            if (data.status) {
                setVerifiedEmailAddress(new Set([email]))

                setShowVerifyEmailModal(false);
                showSuccess(data.message)
            } else {
                showInfo(data.message)
            }

            setEmailVerified(true);

        } catch (error) {
            console.log('error', error)
            showInfo(error.message)
        } finally {
        }
    }
    const handleConfirmPhoneCode = async ({ payload, code }) => {
        if (!payload.phone || !code) return;


        try {
            const { phone, country } = payload;
            const phoneNumber = `${country}${phone}`
            const res = await handleVerifyPhoneOTPApi({ phoneId: phoneNumber, otp: code })

            const data = res?.data || {}
            const { message, status } = data.verifyPhoneOTPV2 || {}
            if (status === 'success') {
                setVerifiedPhoneNumber(new Set([phoneNumber]))
                setPhoneVerified(true);
                setIsHasValidPhone(true)
                setShowVerifyPhoneModal(false);
                showSuccess(message)
            } else {
                showInfo(message)
            }


        } catch (error) {
            console.log('error', error)
            showInfo(error.message)
        } finally {
        }
    }

    const handleSubmit = async (values) => {
        setBusy(true);
        try {
            // 验证日期
            const dobError = dateOfBirthValidator(values.date_of_birth);

            if (dobError) {
                setBusy(false);
                return;
            }

            // 校验手机号
            if (isHasValidPhone && !phoneVerified) {
                showInfo('You need to verify your Phone Number')
                return
            }

            // 校验邮箱
            if (isHasValidEmail && !emailVerified) {
                showInfo('You need to verify your email to successfully make changes')
                return
            }

            // 验证是否同意条款 && isPhoneSignUp 手机号登录
            if (!agreedToTerms && (isPhoneSignUp || isEmailSignUp)) {
                // showInfo('You have to agree to the Privacy Policy & Terms and Conditions');
                setAgreedToTerms(false)
                setBusy(false);
                return;
            }
            const { country, phone } = pendingPayload || {}
            const phonenumber = isPersonalInfo ? `${country}${phone}` : initialData.phonenumber
            const formData = {
                firstname: values.firstname,
                lastname: values.lastname,
                gender: values.gender ? Number(values.gender) : '',
                date_of_birth: formatDateToYMD(values.date_of_birth),
                email: values.email || '',
                pendingPayload,
                phonenumber: phonenumber,
                hobbies: hobbies?.map(({ category, selectedOptions }) => ({ category, selectedOptions })) || [],
                // referralCode: values.referralCode || null
            };


            if (onNext) {
                try {
                    const res = await onNext(formData);
                    if (!res?.status) {
                        showInfo(res?.message)
                        return
                    }

                    if (['phone', 'email'].includes(signUpType)) {
                        const memberId = storage.getItem('member_id');

                        registerSuccessTracking({
                            sign_up_method: signUpType,
                            loyalty_id: memberId || '',
                            user_status: signUpType === 'phone' ? 'new' : 'existing',
                            registration_source: getDeviceType() === 'mobile' ? 'mobile_web' : 'web',
                            registration_page: window.location.href || '/',
                        })
                    }

                    showSuccess(res?.message)
                } catch (error) {
                    showInfo(error.message)
                    return
                }
            }

            // 手机号登录有机会获得积分，有奖励弹窗
            if (isPhoneSignUp) {
                // 提交成功展示成果弹窗
                setShowRegistrationSuccessfulModal(true)
            } else {
                // 兴趣爱好弹窗
                !isPersonalInfo && setShowHobbiesModal(true);
            }

        } catch (e) {
            showInfo(e?.message || 'Failed to submit form');
        } finally {
            setBusy(false);
        }
    };

    const handleRegistrationSuccessfulConfirm = () => {
        setShowRegistrationSuccessfulModal(false);
        setShowHobbiesModal(true);
    }

    const handleHobbiesConfirm = async (selectedCategories) => {

        if (isPersonalInfo) {
            setShowHobbiesModal(false);
            setHobbies(selectedCategories);
            return true
        } else {
            try {

                const res = await saveCustomerHobbies({
                    variables: {
                        hobbies: selectedCategories
                    }
                })

                const data = res?.data?.collectCustomerHobbies || {}

                if (data.status === 'success') {
                    showSuccess(res.message)
                    return true
                } else if (data.status === 'fail') {
                    showInfo(res.message)
                    return false
                }

                return false
            } catch (error) {
                showInfo(error.message)
                return false
            }
        }

    }
    const handleHobbiesSkip = () => {
        setShowHobbiesModal(false);
        if (isPersonalInfo) {

        } else {
            getRedirect('/')
        }
    }

    const handleHobbyRemove = (event, category, key) => {
        event.stopPropagation();
        const updatedHobbies = hobbies?.map(item => {
            if (item.category === category) {
                const selectedOptions = item.selectedOptions?.filter(opt => opt !== key);

                return selectedOptions?.length ? {
                    ...item,
                    selectedOptions
                } : null
            }
            return item
        })?.filter(Boolean);
        setHobbies(updatedHobbies);
    }

    // 跳转 Address List：web / H5 共用 /my-account-information，内部消费 state.tabId 直达地址列表
    const handleAddAddressClick = () => {
        history.push({
            pathname: '/my-account-information',
            state: { tabId: 'addressList' }
        });
    };

    if (!open) return null;

    return (
        <div className={defaultClasses.containerStyle} aria-hidden={!open}>
            <div className={defaultClasses.cardStyle} role="dialog" aria-modal="true">
                {/* <Toast
                    visible={!!toastState}
                    type={toastState?.type}
                    message={toastState?.message}
                /> */}
                {!isPersonalInfo && (<div className={defaultClasses.header}>
                    <button onClick={() => setShowReturnBackConfirmModal(true)} aria-label="close" className={defaultClasses.closeButtonStyle}>
                        {isPhone ? (<Close size={24} color='#212121' />) : (<ChevronLeft size={32} color='#212121' />)}
                    </button>
                    <div className={defaultClasses.headerTitle}>{isPhoneSignUp ? 'REGISTER' : 'Personal Information'}</div>
                </div>)}

                <Form className={[classes.form, defaultClasses.formInfo].join(' ')} onSubmit={handleSubmit} getApi={api => { formApiRef.current = api; }}>
                    {/* First Name */}
                    <Field
                        isRequired
                        label={formatMessage({ id: 'signUp.firstname', defaultMessage: 'First Name' })}
                    >
                        <TextInput
                            field="firstname"
                            maxLength={50}
                            className={defaultClasses.inputStyle}
                            validate={firstNameValidator}
                            placeholder={formatMessage({ id: 'signUp.firstNamePlaceholder', defaultMessage: 'Enter your First name' })}
                            validateOnBlur
                            initialValue={initialData.firstname}
                        />
                    </Field>

                    {/* Last Name */}
                    <Field
                        isRequired
                        label={formatMessage({ id: 'signUp.lastname', defaultMessage: 'Last Name' })}
                    >
                        <TextInput
                            field="lastname"
                            maxLength={50}
                            className={defaultClasses.inputStyle}
                            validate={lastNameValidator}
                            placeholder={formatMessage({ id: 'signUp.lastNamePlaceholder', defaultMessage: 'Enter your First name' })}
                            validateOnBlur
                            initialValue={initialData.lastname}
                        />
                    </Field>

                    {/* Gender */}
                    {gednerOptions?.customAttributeMetadata?.items?.[0]?.attribute_options && (<Field
                        isRequired
                        label={formatMessage({ id: 'signUp.gender', defaultMessage: 'Gender' })}
                    >
                        <RadioGroup
                            field="gender"
                            validateOnChange
                            validate={genderValidator}
                            items={gednerOptions?.customAttributeMetadata?.items?.[0]?.attribute_options}
                            initialValue={![null, undefined].includes(initialData.gender) ? String(initialData.gender) : ''}
                        />
                    </Field>)
                    }

                    {/* Date of Birth */}
                    <Field
                        isRequired
                        label={formatMessage({ id: 'signUp.date_of_birth', defaultMessage: 'Date of Birth' })}
                    >
                        <div style={{ position: 'absolute', display: 'none' }}>
                            <TextInput
                                field='date_of_birth'
                                validate={dateOfBirthValidator}
                                validateOnChange
                                value={selectedDate ? selectedDate.toISOString() : ''}
                                onChange={() => { }}
                                initialValue={selectedDate ? selectedDate.toISOString() : ''}
                            />

                        </div>
                        <DatePickerField
                            disabled={initialData.date_of_birth}
                            field="date_of_birth"
                            initialValue={initialData.date_of_birth}
                            maxDate={getMaxDateFor17YearsOld()}
                        />
                        {!isPersonalInfo && (<div className={defaultClasses.hintTextStyle}>
                            <Info size={12} style={{ marginRight: 4 }} />
                            {formatMessage({
                                id: 'signUp.dobHint',
                                defaultMessage: 'Once submitted, the birthday cannot be edited again.'
                            })}
                        </div>)}

                        {/* Birthday Benefits Banner */}
                        {isPhoneSignUp && (<div className={defaultClasses.infoBannerStyle}>
                            <img className={defaultClasses.infoIconStyle} src='/venia-static-assets/images/award_mark_icon.png' alt="awardMarkIcon" />
                            <div className={defaultClasses.infoTextStyle}>
                                {formatMessage({
                                    id: 'signUp.birthdayBenefits',
                                    defaultMessage: 'By entering your birthdate, you will receive a birthday gift on your birthday.'
                                })}
                            </div>
                        </div>)}
                    </Field>

                    {/* Phone */}
                    {isPersonalInfo && (<Field
                        isRequired={true}
                        label={formatMessage({
                            id: 'phone.number',
                            defaultMessage: 'Phone Number'
                        })}
                    >

                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'start' }}>
                            <div style={{ minWidth: 92, backgroundColor: '#FAFAFA' }}>
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

                            <div style={{ flex: 1, marginLeft: 8, position: 'relative' }}>
                                <TextInput
                                    style={Boolean(phoneErrorMessage) || (phoneVerified && !verifiedPhoneNumber.has(`${country.value}${verifyPhoneNumber}`)) ? { border: '1.3px solid #f87171', height: 44 } : { height: 44 }}
                                    inputMode="numeric"
                                    field="phone"
                                    placeholder={formatMessage({ id: 'phone.placeholder', defaultMessage: 'Enter your Phone Number' })}
                                    onKeyPress={(e) => {
                                        if (!/\d/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    validate={phoneValidator}
                                    validateOnBlur
                                    mask={v => v && v.trim()}
                                    maskOnBlur
                                    onChange={e => {
                                        const value = (e && e.target && e.target.value) ? e.target.value : '';
                                        setVerifyPhoneNumber(value);
                                        setPendingPayload({ ...pendingPayload, phone: value })
                                        setPhoneVerified(verifiedPhoneNumber.has(`${country.value}${value}`))
                                        setIsHasValidPhone(verifiedPhoneNumber.has(`${country.value}${value}`))
                                        setPhoneErrorMessage('')
                                        setIsPhoneChangedFlag(true)
                                    }}
                                    initialValue={initialData.phone}
                                />
                                {!verifiedPhoneNumber.has(`${country.value}${verifyPhoneNumber}`) && isHasValidPhone && (<button
                                    type="button"
                                    onClick={handleVerifyPhone}
                                    disabled={!isHasValidPhone || isVerifiedPhoneLoading}
                                    className={[defaultClasses.verifyButtonStyle, (!isHasValidPhone || isVerifiedPhoneLoading) ? defaultClasses.disabledColor : ''].join(' ')}
                                >
                                    {isVerifiedPhoneLoading ? <Loader size={14} color="#BDBDBD" /> : 'Verify'}
                                </button>)}
                            </div>
                        </div>
                        <PhoneHint />
                    </Field>)}

                    {/* Email */}
                    <Field
                        id='email'
                        label={formatMessage({ id: 'signUp.email', defaultMessage: 'Email Address' })}
                    >
                        <div className={defaultClasses.emailWrapperStyle}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <TextInput
                                    field="email"
                                    className={defaultClasses.inputStyle}
                                    validate={emailValidator}
                                    validateOnBlur
                                    disabled={isEmailSignUp}
                                    style={Boolean(emailErrorMessage) || (emailVerified && !verifiedEmailAddress.has(verifyEmailAddress)) ? { border: '1.3px solid #f87171' } : {}}
                                    placeholder={formatMessage({ id: 'email.placeholder', defaultMessage: 'Enter your Email' })}
                                    onChange={e => {
                                        const value = (e && e.target && e.target.value) ? e.target.value : '';
                                        setVerifyEmailAddress(value);
                                        setEmailVerified(verifiedEmailAddress.has(value))
                                        setIsHasValidEmail(verifiedEmailAddress.has(value))
                                        setEmailErrorMessage('')
                                        setIsEmailChangedFlag(true)
                                    }}
                                    initialValue={initialData.email}
                                />
                                {!verifiedEmailAddress.has(verifyEmailAddress) && isHasValidEmail && (<button
                                    type="button"
                                    onClick={handleVerifyEmail}
                                    disabled={!isHasValidEmail || isVerifiedEmailLoading}
                                    className={[defaultClasses.verifyButtonStyle, (!isHasValidEmail || isVerifiedEmailLoading) ? defaultClasses.disabledColor : ''].join(' ')}
                                >
                                    {isVerifiedEmailLoading ? <Loader size={14} color="#BDBDBD" /> : 'Verify'}
                                </button>)}
                            </div>

                        </div>
                        <EmailHint />
                    </Field>

                    {/* Referral Code */}
                    {/* {!isPersonalInfo && (<Field
                        label={formatMessage({ id: 'signUp.referralCode', defaultMessage: 'Referral code' })}
                    >
                        <TextInput
                            field="referralCode"
                            className={defaultClasses.inputStyle}
                            placeholder={formatMessage({
                                id: 'signUp.referralPlaceholder',
                                defaultMessage: 'Enter Referral code'
                            })}
                            initialValue={initialData.referralCode}
                        />
                    </Field>)} */}

                    {isPersonalInfo && (<Field
                        classes={{ root: classes.relative }}
                        label={formatMessage({ id: 'signUp.referralCode', defaultMessage: 'Interests' })}
                    >
                        {hobbies?.length ? (<LinkButton type="button" className={classes.hobbiesEditBtn} onClick={() => setShowHobbiesModal(true)}>Edit</LinkButton>) : null}
                        <div className={classes.inputWithChevron} onClick={!hobbies?.length ? () => setShowHobbiesModal(true) : () => { }}>
                            {hobbies?.length ?
                                hobbies?.map((item, index) => {
                                    return item.selectedOptions?.map(subItem => {
                                        return (
                                            <span key={item.category + subItem} className={classes.hobbyItem}>{subItem} <Close size={12} color='#222222' onClick={(e) => handleHobbyRemove(e, item.category, subItem)} /></span>
                                        )
                                    })
                                }) : 'Add your interests'
                            }
                            {!hobbies?.length && <ChevronRight size={16} color="#474645" className={classes.chevronRightArrow} />}
                        </div>
                    </Field>
                    )}

                    {/* Terms and Conditions */}
                    {(isPhoneSignUp || isEmailSignUp) && (
                        <div>
                            <div className={defaultClasses.checkboxWrapperStyle}>
                                <input
                                    type="checkbox"
                                    style={{ background: '#FAFAFA', border: '1.3px solid #CCCAC6' }}
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className={defaultClasses.checkboxStyle}
                                    id="terms-checkbox"
                                />
                                <label htmlFor="terms-checkbox" style={{ fontSize: 12, color: '#757575', cursor: 'pointer' }}>
                                    {formatMessage({
                                        id: 'signUp.agreeTerms',
                                        defaultMessage: 'I have read and agree to the'
                                    })}{' '}
                                    <a href="/privacy-policy" className={defaultClasses.linkStyle} target="_blank" rel="noopener noreferrer">
                                        {formatMessage({ id: 'signUp.privacyPolicy', defaultMessage: 'Privacy Policy' })}
                                    </a>
                                    {' & '}
                                    <a href="/terms-conditions" className={defaultClasses.linkStyle} target="_blank" rel="noopener noreferrer">
                                        {formatMessage({ id: 'signUp.terms', defaultMessage: 'Terms and Conditions' })}
                                    </a>
                                </label>
                            </div>
                            {agreedToTerms === false && (<div className={[defaultClasses.hintTextStyle, !isPhone ? defaultClasses.errorText : ''].join(' ')} style={{ color: '#CC2B1E' }}>
                                {isPhone ? (<Info size={12} style={{ marginRight: 4 }} />) : null}
                                <FormattedMessage
                                    id={'signUpModal.agreedToTerms'}
                                    defaultMessage={'You have to agree to the Privacy Policy & Terms and Conditions.'}
                                />
                            </div>)}
                        </div>
                    )
                    }

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={busy}
                        className={defaultClasses.nextButtonStyle}
                    >
                        {busy && <Loader size={14} color="#fff" />}
                        <FormattedMessage id="signUp.next" defaultMessage={isPersonalInfo ? 'Save' : (isPhoneSignUp ? 'REGISTER' : 'Confirm')} />
                    </Button>

                    {/* Add Address：仅个人资料编辑时显示，跳转 Address List */}
                    {isPersonalInfo && (
                        <Button
                            type="button"
                            className={defaultClasses.addAddressButtonStyle}
                            onClick={handleAddAddressClick}
                        >
                            <FormattedMessage id="signUp.addAddress" defaultMessage="Add Address" />
                        </Button>
                    )}
                </Form>
            </div>

            {/* Verify Email Code Modal */}
            <VerifyEmailCodeModal
                open={showVerifyEmailModal}
                email={verifyEmailAddress}
                onResend={handleSendEmailOTP}
                onConfirm={handleConfirmEmailCode}
                onClose={() => { setShowVerifyEmailModal(false); }}
            />

            {/* Verify Phone Code Modal */}
            <VerifyPhoneCodeModal
                open={showVerifyPhoneModal}
                phone={verifyPhoneNumber}
                method={sendCodeMethod}
                onResend={handleRequestSendPhoneOTPApi}
                payload={pendingPayload}
                onConfirm={handleConfirmPhoneCode}
                onClose={() => { setShowVerifyPhoneModal(false); }}
            />

            {/* Registration Successful Modal */}
            <RegistrationSuccessfulModal
                open={showRegistrationSuccessfulModal}
                onClose={() => setShowRegistrationSuccessfulModal(false)}
                points={points}
                onConfirm={handleRegistrationSuccessfulConfirm}
            />

            {/* Hobbies Modal */}
            <HobbiesModal
                open={showHobbiesModal}
                onClose={handleHobbiesSkip}
                categories={hobbiesCategories}
                onConfirm={handleHobbiesConfirm}
                initialSelected={hobbies}
                onSkip={handleHobbiesSkip}
            />

            {/* Verification Method Modal */}
            <VerificationMethodModal
                smsEnabled={loginRadiusSmsEnabled}
                open={showVerificationModal}
                onClose={() => { setShowVerificationModal(false); }}
                payload={pendingPayload}
                onSuccess={handleModalSuccess}
            />

            {/* return back confirm modal */}
            <ReturnBackConfirmModal open={showReturnBackConfirmModal} description="This page contains required information. If you close it, you will not be able to sign in successfully." onCloseConfirm={() => setShowReturnBackConfirmModal(false)} onCancel={handleClose} />
        </div>
    );
};

SignUpModal.propTypes = {
    open: PropTypes.bool,
    onNext: PropTypes.func,
    onClose: PropTypes.func,
    initialData: PropTypes.object
};

export default SignUpModal;

