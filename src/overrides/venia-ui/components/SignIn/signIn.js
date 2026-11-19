import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { func, shape, string } from 'prop-types';
import { Form, useFormApi } from 'informed';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { useSignIn } from '@magento/peregrine/lib/talons/SignIn/useSignIn';

import { useStyle } from '@magento/venia-ui/lib/classify';
import {
    isRequired,
    validateEmail
} from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Field from '@magento/venia-ui/lib/components/Field';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import defaultClasses from '@magento/venia-ui/lib/components/SignIn/signIn.module.css';
import { GET_CART_DETAILS_QUERY } from '@magento/venia-ui/lib/components/SignIn/signIn.gql';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import Password from '@magento/venia-ui/lib/components/Password';
import FormError from '@magento/venia-ui/lib/components/FormError/formError';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import EmailSignIn from '../../../../modules/custom-modules/components/Login/emailSignIn';
import PhoneSignInInformed from '../../../../modules/custom-modules/components/Login/phoneSignIn';
import GoogleReCaptcha from '@magento/venia-ui/lib/components/GoogleReCaptcha';

const SignIn = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const {
        setDefaultUsername,
        showCreateAccount,
        showForgotPassword,
        redirectNotifyMe = ''
    } = props;

    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();

    // 检查是否有 token，有则重定向到首页（仅在挂载时执行一次）
    useEffect(() => {
        const storage = new BrowserPersistence();
        const token = storage.getItem('signin_token');
        if (token) {
            history.replace('/');
        }
    }, []);

    const talonProps = useSignIn({
        getCartDetailsQuery: GET_CART_DETAILS_QUERY,
        setDefaultUsername,
        showCreateAccount,
        showForgotPassword,
        redirectNotifyMe
    });

    const {
        errors,
        // handleCreateAccount,
        handleForgotPassword,
        handleSubmit,
        handleSubmitOtp,
        otpConfig,
        isBusy,
        setFormApi,
        recaptchaWidgetProps,
        handleSignIn,
        handleRequestPhoneOTPApi,
        handleVerifyPhoneOTPApi,
        getCustomerHobbies,
        createAccountMutationApi,
        AuthNextStep
    } = talonProps;

    // 本地视图：'email' 或 'phone'，默认根据 URL 参数 loginType 决定
    const getViewModeFromUrl = () => {
        const params = new URLSearchParams(location.search);
        const loginType = params.get('loginType');
        if (loginType === 'email') return 'email';
        if (loginType === 'phone') return 'phone';
        return 'email'; // 默认 email
    };

    const [viewMode, setViewMode] = useState(getViewModeFromUrl);

    // 监听 URL 变化，同步 viewMode
    useEffect(() => {
        const mode = getViewModeFromUrl();
        setViewMode(mode);
    }, [location.search]);

    const enableOtp =
        otpConfig && otpConfig.otpConfig.otp_enable[0].enable_otp_register;


    const OtpInput = () => {
        const formApi = useFormApi();

        const phonrNumber = formApi.getState('phonenumber');

        return (
            <TextInput
                after={
                    <Button
                        onClick={() =>
                            handleSubmitOtp(phonrNumber.values.phonenumber)
                        }
                        className={classes.otpButton}
                        type="button"
                    >
                        Send
                    </Button>
                }
                field="phonenumber"
                autoComplete="phonenumber"
                validate={isRequired}
                validateOnBlur
                mask={value => value && value.trim()}
                maskOnBlur={true}
            />
        );
    };

    if (isBusy) {
        return (
            <div className={classes.modal_active}>
                <LoadingIndicator>
                    <FormattedMessage
                        id={'signIn.loadingText'}
                        defaultMessage={'Signing In'}
                    />
                </LoadingIndicator>
            </div>
        );
    }


    return (
        <div className={classes.root}>
            <GoogleReCaptcha {...recaptchaWidgetProps} />
            <FormError errors={Array.from(errors.values())} />
            {/* <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <Button
                    priority={viewMode === 'email' ? 'high' : 'low'}
                    type="button"
                    onClick={() => setViewMode('email')}
                >
                    <FormattedMessage id="signIn.emailTab" defaultMessage="Email" />
                </Button>
                <Button
                    priority={viewMode === 'phone' ? 'high' : 'low'}
                    type="button"
                    onClick={() => setViewMode('phone')}
                >
                    <FormattedMessage id="signIn.phoneTab" defaultMessage="Phone" />
                </Button>
            </div> */}

            {viewMode === 'email' ? (
                <EmailSignIn
                    classes={props.classes}
                    setFormApi={setFormApi}
                    handleViewMode={mode => setViewMode(mode)}
                    handleForgotPassword={handleForgotPassword}
                    talonProps={talonProps}
                />
            ) : (
                <PhoneSignInInformed
                    handleViewMode={mode => setViewMode(mode)}
                    initialCountry="+62"
                    classes={props.classes}
                    talonProps={talonProps}
                />
            )}

            {enableOtp && viewMode === 'email' && (
                <>
                    <p>or otp login</p>
                    <Form getApi={setFormApi} className={classes.form}>
                        <Field label="Phone Number">
                            <OtpInput />
                        </Field>
                        <Field label="Otp">
                            <TextInput
                                autoComplete="otp"
                                field="otp"
                                validate={isRequired}
                            />
                        </Field>

                        <div className={classes.buttonsContainer}>
                            <Button priority="high" type="submit">
                                <FormattedMessage
                                    id={'signIn.signInText'}
                                    defaultMessage={'Sign In'}
                                />
                            </Button>
                        </div>
                    </Form>
                </>
            )}
        </div>
    );
};

export default SignIn;
SignIn.propTypes = {
    classes: shape({
        buttonsContainer: string,
        form: string,
        root: string,
        labelText: string
    }),
    setDefaultUsername: func,
    showCreateAccount: func,
    showForgotPassword: func
};
SignIn.defaultProps = {
    setDefaultUsername: () => { },
    showCreateAccount: () => { },
    showForgotPassword: () => { }
};
