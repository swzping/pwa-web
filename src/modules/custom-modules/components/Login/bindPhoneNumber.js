import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, X as Close, Loader } from 'react-feather';
import { FormattedMessage, useIntl } from 'react-intl';
import Select from 'react-select';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Toast, { useToastState, useToast } from '../Common/Toast';
import ReturnBackConfirmModal from './returnBackConfirmModal';
import { Form } from 'informed';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import signInClasses from '@magento/venia-ui/lib/components/SignIn/signIn.module.css';
import { useHistory } from 'react-router-dom';
import Field from '@magento/venia-ui/lib/components/Field';
import localClasses from './bindPhoneNumber.module.css';
import { useSignInCommon } from '../../../../overrides/peregrine/talons/SignIn/useSignIn'


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
const BindPhoneModal = ({ open, onNext, phoneErrorMessage, setPhoneErrorMessage, isRendCodeLoading, initialCountry = '+62', classes: classesProp = {}, onClose }) => {
    const classes = useStyle(localClasses, signInClasses, classesProp);
    const { handleStoreConfig } = useSignInCommon()
    const { formatMessage } = useIntl();
    const { showInfo } = useToast();
    const formApiRef = useRef();

    const history = useHistory();
    const [pendingPayload, setPendingPayload] = useState(null);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
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
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');


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
    }, [isPhone]);

    useEffect(() => {
        countryRef.current = country;
    }, [country]);

    useEffect(() => {
        if (phoneErrorMessage) {
            const api = formApiRef.current;
            if (typeof api?.setError === 'function') {
                api.setError('phone', {
                    id: 'phone.invalid', defaultMessage: phoneErrorMessage
                });
            }
        }
    }, [phoneErrorMessage])

    useEffect(() => {
        setLoading(isRendCodeLoading)
    }, [isRendCodeLoading])

    // 根据当前选择的国家校验手机号，返回 formatjs message descriptor 或 undefined
    const phoneValidator = useCallback(
        value => {
            const v = value;

            const len = v?.length;
            const countryCode = (countryRef.current && countryRef.current.value) || initialCountry || '+62';
            const limits = localLengthMap[countryCode] || { min: 6, max: 15 };

            if (phoneErrorMessage) {
                return {
                    id: 'phone.invalid', defaultMessage: phoneErrorMessage
                };
            }

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
    const handleSubmit = async values => {
        setSubmitError('');
        const phoneRaw = values?.phone;
        const err = phoneValidator(phoneRaw);
        if (err) {
            setSubmitError(err);
            return;
        }
        const payload = { country: country.value, phone: normalizePhone(phoneRaw) };
        setPendingPayload(payload);

        setLoading(true)
        const loginRadiusSmsEnabled = await handleStoreConfig()
        setLoading(false)

        onNext && onNext(payload, loginRadiusSmsEnabled);
    };

    const handleClose = () => {
        setShowReturnBackConfirmModal(false)
        onClose && onClose()
        showInfo('Sign-in/Sign-up Unsuccessful.')

    }

    if (!open) return null;

    return (
        <>
            <div className={localClasses.container} aria-hidden={!open}>
                <div className={localClasses.card} role="dialog" aria-modal="true">
                    <div className={localClasses.header}>
                        <button
                            onClick={() => setShowReturnBackConfirmModal(true)}
                            aria-label="close"
                            className={localClasses.closeButton}
                        >
                            {isPhone ? (<Close size={24} color='#212121' />) : (<ChevronLeft size={32} color='#212121' />)}
                        </button>
                        <div className={localClasses.headerTitle}>Add Phone Number</div>
                    </div>

                    {isPhone && (<div className={localClasses.headerTitlePhone}>Add Phone Number</div>)}
                    <div className={localClasses.description}>
                        Please bind your phone number to ensure account security and successful login.
                    </div>
                    <Form className={classes.form} onSubmit={handleSubmit} getApi={api => { formApiRef.current = api; }}>

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
                                        style={{ height: 44 }}
                                        field="phone"
                                        inputMode="numeric"
                                        onKeyPress={(e) => {
                                            if (!/\d/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={() => {
                                            setPhoneErrorMessage && setPhoneErrorMessage('')
                                        }}
                                        placeholder={formatMessage({ id: 'phone.placeholder', defaultMessage: 'Enter your Phone Number' })}
                                        validate={phoneValidator}
                                        validateOnBlur
                                        mask={v => v && v.trim()}
                                        maskOnBlur
                                    />
                                </div>
                            </div>
                        </Field>


                        <div className={classes.buttonsContainer}>
                            <div className={classes.buttonWrapper} style={{ width: '100%' }}>
                                <Button
                                    priority="high"
                                    type="submit"
                                    className={classes.buttonsSignIn}
                                    disabled={loading}
                                >
                                    {loading && <Loader size={14} color="#fff" />}
                                    <FormattedMessage id="phone.next" defaultMessage="NEXT" />
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
            <ReturnBackConfirmModal open={showReturnBackConfirmModal} description='Because you cannot login into your account without having a verified phone number.' onCloseConfirm={() => setShowReturnBackConfirmModal(false)} onCancel={handleClose} />
        </>
    );
};

BindPhoneModal.propTypes = {
    open: PropTypes.bool,
    initialCountry: PropTypes.string,
    initialPhone: PropTypes.string,
    onSubmit: PropTypes.func,
    onClose: PropTypes.func
};

export default BindPhoneModal;
