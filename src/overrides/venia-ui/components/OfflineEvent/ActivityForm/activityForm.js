import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef
} from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { useHistory } from 'react-router-dom';
import { ChevronRight, Loader } from 'react-feather';
import Select from 'react-select';
import { Form, useFormApi } from 'informed';
import { FormattedMessage, useIntl } from 'react-intl';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import Button from '@magento/venia-ui/lib/components/Button';
import Field, { Message } from '@magento/venia-ui/lib/components/Field';
import { useQuery, useMutation } from '@apollo/client';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import { parsePhoneNumber } from '@/helpers/hooks';
import {
    isRequired,
    validateEmail
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import DEFAULT_OPERATIONS from '../../../../peregrine/talons/SignIn/signIn.gql';
import { HeaderContext } from '../../../../../overrides/peregrine/context/header';
import OfflineHeader from '../components/Header';
import OfflineBgImage from '../components/BgImage';
import OfflineBgCardImage from '../components/BgCardImage';
import ActivityModal from '../components/Modal/activityModal';
import { submitEventRegistration } from '../offlineEvent.gql';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import compClasses from './activityForm.module.css';

const DEFAULT_COUNTRIES = [{ code: '+62', label: '+62' }];
const localLengthMap = {
    '+62': { min: 9, max: 12, pattern: /^\+628[1-9]\d{7,10}$/ } // Indonesia
};
const errorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

const ActivityFormPage = props => {
    const { onChangeIndex, submitData } = props || {};
    const classes = useStyle(compClasses);
    const { formatMessage } = useIntl();
    const { setNavConfig } = useContext(HeaderContext);
    const windowSize = useWindowSize();
    const history = useHistory();
    const [countryCode, setCountryCode] = useState('+62');
    const [modalProps, setModalProps] = useState({
        visible: false,
        title: '',
        description: ''
    });
    // react-select 使用 { value, label } 形式的 option
    const countryOptions = useMemo(
        () => DEFAULT_COUNTRIES.map(c => ({ value: c.code, label: c.label })),
        []
    );
    const [country, setCountry] = useState(
        () =>
            countryOptions.find(o => o.value === countryCode) ||
            countryOptions[0]
    );
    const countryRef = useRef(country);
    const formApiRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [, { addToast }] = useToasts();
    const params = new URLSearchParams(location.search);
    const eventId = params.get('eventId');
    const eventName = params.get('eventName');

    // 获取用户信息
    const { data, loading, error } = useQuery(
        DEFAULT_OPERATIONS.getCustomerInformation,
        {
            fetchPolicy: 'no-cache'
        }
    );

    const [setRegisterForm] = useMutation(submitEventRegistration, {
        fetchPolicy: 'no-cache'
    });

    useEffect(() => {
        countryRef.current = country;
    }, [country]);

    useEffect(() => {
        setNavConfig({
            showMobileNav: false
        });
    }, [windowSize]);

    useEffect(() => {
        if (data?.customer) {
            const customer = data.customer;
            const {
                customer_email,
                phonenumber,
                firstname,
                lastname
            } = customer;
            const { countryCode: areaCode, phoneNumber } = parsePhoneNumber(
                phonenumber
            );
            areaCode && setCountryCode(areaCode);
            formApiRef.current?.setValues({
                firstName: firstname,
                lastName: lastname,
                email: data.customer.customer_email,
                phoneNumber: phoneNumber
            });
        }
    }, [data]);

    const firstNameValidator = useCallback(value => {
        if (!value || !value.trim()) {
            return {
                id: 'firstname.required',
                defaultMessage: 'Please enter your first name'
            };
        }
        return undefined;
    }, []);

    const lastNameValidator = useCallback(value => {
        if (!value || !value.trim()) {
            return {
                id: 'lastname.required',
                defaultMessage: 'Please enter your last name'
            };
        }
        return undefined;
    }, []);
    const phoneValidator = useCallback(value => {
        const len = value?.length;
        const countryCode =
            (countryRef.current && countryRef.current.value) || '+62';
        const limits = localLengthMap[countryCode] || { min: 6, max: 15 };
        if (!value || !value.trim()) {
            return {
                id: 'bookingForm.requiredPhone',
                defaultMessage: 'Phone number is required'
            };
        }

        if (len < limits.min || len > limits.max) {
            return {
                id: 'phone.tooShortForCountry',
                defaultMessage: `Please enter a valid phone number.`
            };
        }

        if (limits.pattern && !limits.pattern.test(`${countryCode}${value}`)) {
            return {
                id: 'phone.invalid',
                defaultMessage: `Please enter a valid phone number.`
            };
        }
        return undefined;
    }, []);

    const emailValidator = useCallback(value => {
        if (!value || !value.trim()) {
            return {
                id: 'bookingForm.requiredEmail',
                defaultMessage: 'Enter your Email'
            };
        }
        // 只允许 .com、.co.id、.id 三个后缀
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(com|co\.id|id)$/i;
        if (value && !emailRegex.test(value)) {
            return {
                id: 'email.invalid',
                defaultMessage:
                    'The email address format seems incorrect, please check it.'
            };
        }
        return undefined;
    }, []);

    const closeModal = () =>
        setModalProps(prev => ({ ...prev, visible: false }));

    const handleJumpToEventDetail = resData => {
        const { message, ticket } = resData || {};
        const params = {
            title: message?.title,
            subTitle: message?.body,
            name:
                ticket?.attendee?.first_name +
                ' ' +
                ticket?.attendee?.last_name,
            code: ticket?.ticket_code,
            eventName: ticket?.event_name,
            location: ticket?.location,
            date: ticket?.event_date_time
        };
        sessionStorage.setItem(
            'offlineBookingWorkshopDetail',
            JSON.stringify(params)
        );
        history.replace('/offline-form-detail');
    };
    // 提交表单
    const handleSubmit = async values => {
        const phoneStr = `${country.value || ''}${values.phoneNumber || ''}`;
        const formData = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email || '',
            phone: phoneStr
        };
        setSubmitting(true);
        try {
            const { data } = await setRegisterForm({
                variables: {
                    input: {
                        event_id: eventId,
                        email: values.email,
                        first_name: values.firstName,
                        last_name: values.lastName,
                        phone: phoneStr
                    }
                }
            });
            const { submitEventRegistration: resData } = data || {};
            if (resData?.success) {
                handleJumpToEventDetail(resData);
            } else {
                setModalProps({
                    visible: true,
                    title: resData?.message?.title,
                    description: resData?.message?.body
                });
            }
        } catch (err) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: 'Sorry, the operation failed, please try again!',
                timeout: 3000
            });
        } finally {
            setTimeout(() => {
                setSubmitting(false);
            }, 1000);
        }
    };

    return (
        <div className={`${classes.root} fullPage`}>
            {/* 导航栏 */}
            <OfflineHeader headerTitle="Event Booking" />
            {/* 背景栏 */}
            <OfflineBgImage />
            {/* 内容区域 */}
            <div className={classes.pageWrapper}>
                <div className={classes.formCard}>
                    <div className={classes.itemRow}>
                        <div className={classes.activeTitle}>{eventName}</div>
                    </div>
                    <Form
                        getApi={api => {
                            formApiRef.current = api;
                        }}
                        className={classes.form}
                        onSubmit={handleSubmit}
                    >
                        {/* First Name */}
                        <Field
                            label={formatMessage({
                                id: 'signUp.firstname',
                                defaultMessage: 'First Name'
                            })}
                        >
                            <TextInput
                                field="firstName"
                                maxLength={50}
                                className={classes.inputStyle}
                                validate={firstNameValidator}
                                placeholder={formatMessage({
                                    id: 'signUp.firstNamePlaceholder',
                                    defaultMessage: 'Enter your First name'
                                })}
                                validateOnBlur
                            />
                        </Field>

                        {/* Last Name */}
                        <Field
                            label={formatMessage({
                                id: 'signUp.lastname',
                                defaultMessage: 'Last Name'
                            })}
                        >
                            <TextInput
                                field="lastName"
                                maxLength={50}
                                className={classes.inputStyle}
                                validate={lastNameValidator}
                                placeholder={formatMessage({
                                    id: 'signUp.lastNamePlaceholder',
                                    defaultMessage: 'Enter your Last name'
                                })}
                                validateOnBlur
                            />
                        </Field>
                        <Field
                            label={formatMessage({
                                id: 'bookingForm.phoneNumber',
                                defaultMessage: 'Phone Number'
                            })}
                        >
                            <div className={classes.phoneRow}>
                                <div
                                    style={{
                                        minWidth: 92,
                                        backgroundColor: '#FAFAFA'
                                    }}
                                >
                                    <Select
                                        className="phoneSignInSelect"
                                        options={countryOptions}
                                        value={country}
                                        onChange={setCountry}
                                        isSearchable={false}
                                        styles={{
                                            control: provided => ({
                                                ...provided,
                                                minHeight: '44px',
                                                borderWidth: 1.3,
                                                borderColor: '#CCCAC6',
                                                boxShadow: 'none',
                                                backgroundColor: '#FAFAFA'
                                            }),
                                            singleValue: provided => ({
                                                ...provided,
                                                fontSize: 14
                                            }),
                                            menu: provided => ({
                                                ...provided,
                                                zIndex: 9999
                                            })
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        marginLeft: 8,
                                        position: 'relative'
                                    }}
                                >
                                    <TextInput
                                        field="phoneNumber"
                                        maxLength={50}
                                        validate={phoneValidator}
                                        className={classes.inputStyle}
                                        placeholder={formatMessage({
                                            id:
                                                'bookingForm.userNamePlaceholder',
                                            defaultMessage:
                                                'Enter your Phone Number'
                                        })}
                                        validateOnBlur
                                    />
                                </div>
                            </div>
                        </Field>
                        <Field
                            label={formatMessage({
                                id: 'bookingForm.Email',
                                defaultMessage: 'Email'
                            })}
                        >
                            <TextInput
                                field="email"
                                maxLength={50}
                                className={classes.inputStyle}
                                validate={emailValidator}
                                placeholder={formatMessage({
                                    id: 'bookingForm.emailPlaceholder',
                                    defaultMessage: 'Enter your Email'
                                })}
                                validateOnBlur
                            />
                        </Field>
                        <div className={classes.buttonWrapper}>
                            <Button
                                priority="high"
                                type="submit"
                                className={classes.submitStyle}
                                disabled={submitting}
                            >
                                {submitting && (
                                    <Loader size={14} color="#fff" />
                                )}
                                <FormattedMessage
                                    id="bookingForm.submitText"
                                    defaultMessage="Submit"
                                />
                            </Button>
                        </div>
                    </Form>
                    <OfflineBgCardImage />
                </div>
            </div>
            {/* Activity Modal */}
            <ActivityModal {...modalProps} onConfirm={() => closeModal()} />
        </div>
    );
};

export default ActivityFormPage;
