import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, useFormApi, Text } from 'informed';
import { func, shape, string, bool } from 'prop-types';
import { useCreateAccount } from '../../../peregrine/talons/CreateAccount/useCreateAccount';

import { useStyle } from '@magento/venia-ui/lib/classify';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import {
    hasLengthAtLeast,
    isRequired,
    validateEmail,
    validatePassword,
    combineValidators
} from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Checkbox from '@magento/venia-ui/lib/components/Checkbox';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import defaultClasses from './createAccount.module.css';
import FormError from '../FormError';
import Password from '@magento/venia-ui/lib/components/Password';
import ErrorMessage from '../ErrorMessage';

const CreateAccount = props => {
    const talonProps = useCreateAccount({
        initialValues: props.initialValues,
        onSubmit: props.onSubmit,
        onRequestOtp: props.onRequestOtp,
        onCancel: props.onCancel
    });

    const {
        errors,
        handleCancel,
        handleSubmit,
        handleRequestOtp,
        isDisabled,
        initialValues,
        otpConfig,
        createAccountData
    } = talonProps;
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, props.classes);
    const enableOtp =
        otpConfig && otpConfig.otpConfig.otp_enable[0].enable_otp_register;

    const createAccountmessage =
        createAccountData && createAccountData.createCustomerCustom ? (
            <>
                {createAccountData.createCustomerCustom.status ? (
                    <ErrorMessage success>
                        {createAccountData.createCustomerCustom.message}
                    </ErrorMessage>
                ) : (
                    <ErrorMessage>
                        {createAccountData.createCustomerCustom.message}
                    </ErrorMessage>
                )}
            </>
        ) : null;

    const OtpInput = () => {
        const formApi = useFormApi();

        const phonrNumber = formApi.getState('customer.phonenumber');

        return (
            <TextInput
                after={
                    <Button
                        onClick={() =>
                            handleRequestOtp(
                                phonrNumber.values.customer.phonenumber
                            )
                        }
                        className={classes.otpButton}
                        type="button"
                    >
                        Send
                    </Button>
                }
                field="customer.phonenumber"
                autoComplete="phonenumber"
                validate={isRequired}
                validateOnChange
                mask={value => value && value.trim()}
                maskOnBlur={true}
            />
        );
    };

    // const cancelButton = props.isCancelButtonHidden ? null : (
    //     <Button
    //         className={classes.cancelButton}
    //         disabled={isDisabled}
    //         type="button"
    //         priority="normal"
    //         onClick={handleCancel}
    //     >
    //         <FormattedMessage
    //             id={'createAccount.cancelText'}
    //             defaultMessage={'Cancel'}
    //         />
    //     </Button>
    // );

    const submitButton = (
        <Button
            className={classes.submitButton}
            disabled={isDisabled}
            type="submit"
            priority="high"
        >
            <FormattedMessage
                id={'createAccount.createAccountText2'}
                defaultMessage={'Create Account'}
            />
        </Button>
    );

    const code = document.getElementById("password-create");

    const strengthbar = document.getElementById("meter");
    const display = document.getElementsByClassName("text-box-password-create")[0];

    const checkpassword = (password) => {
        let strength = 0;
        if (password.match(/[a-z]+/)) {
            strength += 1;
        }
        if (password.match(/[A-Z]+/)) {
            strength += 1;
        }
        if (password.match(/[0-9]+/)) {
            strength += 1;
        }
        if (password.match(/[$@#&!]+/)) {
            strength += 1;
        }

        if (password.length < 6) {
            display.innerHTML = "Weak";
        }

        if (password.length >= 8 ) {
            display.innerHTML = "Strong";
        }

        switch (strength) {
            case 0:
            strengthbar.value = 0;
            display.innerHTML = "No Password";
            strengthbar.classList.remove("weak");
            break;

            case 1:
            strengthbar.value = 25;
            strengthbar.classList.remove("status-bar");
            strengthbar.classList.remove("medium");
            strengthbar.classList.remove("strong");
            strengthbar.classList.remove("very-strong");
            strengthbar.classList.add("weak");
            break;

            case 2:
            strengthbar.value = 50;
            strengthbar.classList.remove("weak");
            strengthbar.classList.remove("strong");
            strengthbar.classList.remove("very-strong");
            strengthbar.classList.add("medium");
            display.innerHTML = "Medium";
            break;

            case 3:
            strengthbar.value = 75;
            strengthbar.classList.remove("medium");
            strengthbar.classList.remove("very-strong");
            strengthbar.classList.add("strong");
            break;

            case 4:
            strengthbar.value = 100;
            strengthbar.classList.remove("strong");
            strengthbar.classList.add("very-strong");
            display.innerHTML = "Very Strong";
            break;
        }
    }

    if (code) {
        code.addEventListener("keyup", function() {
            checkpassword(code.value);
        });
    }

    return (
        <div className={classes.root}>
            {createAccountmessage}
            <Form
                className={classes.form}
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                <FormError errors={Array.from(errors.values())} />
                <Field
                    label={formatMessage({
                        id: 'createAccount.firstNameText',
                        defaultMessage: 'First Name'
                    })}
                >
                    <TextInput
                        field="customer.firstname"
                        autoComplete="given-name"
                        validate={isRequired}
                        validateOnChange
                        mask={value => value && value.trim()}
                        maskOnBlur={true}
                    />
                </Field>
                <Field
                    label={formatMessage({
                        id: 'createAccount.lastNameText',
                        defaultMessage: 'Last Name'
                    })}
                >
                    <TextInput
                        field="customer.lastname"
                        autoComplete="family-name"
                        validate={isRequired}
                        validateOnChange
                        mask={value => value && value.trim()}
                        maskOnBlur={true}
                    />
                </Field>
                <Field
                    label={formatMessage({
                        id: 'createAccount.emailText',
                        defaultMessage: 'Email'
                    })}
                >
                    <TextInput
                        field="customer.email"
                        autoComplete="email"
                        validate={combine([isRequired, validateEmail])}
                        validateOnChange
                        mask={value => value && value.trim()}
                        maskOnBlur={true}
                    />
                </Field>
                <Password
                    autoComplete="new-password"
                    fieldName="password"
                    isToggleButtonHidden={false}
                    label={formatMessage({
                        id: 'createAccount.passwordText',
                        defaultMessage: 'Password'
                    })}
                    validate={combine([
                        isRequired,
                        validatePassword,
                        [hasLengthAtLeast, 8]
                    ])}
                    validateOnChange
                    mask={value => value && value.trim()}
                    maskOnBlur={true}
                    id="password-create"
                />
                <div className={classes.progressBar}><span className={classes.titleBar}>Password Strength : </span>
                    <div className="status-bar" max="100" value="0" id="meter" />
                    <div class="text-box-password-create text-center"> No Password </div>
                </div>
                {enableOtp && (
                    <>
                        <Field label="Phone Number">
                            <OtpInput />
                        </Field>
                        <Field label="Code Otp">
                            <TextInput
                                field="otp"
                                autoComplete="otp"
                                validate={isRequired}
                                validateOnChange
                                mask={value => value && value.trim()}
                                maskOnBlur={true}
                            />
                        </Field>
                    </>
                )}
                <div className={classes.subscribe}>
                    <Checkbox
                        field="subscribe"
                        id="subscribe"
                        label={
                            <span>
                            I have read and agreed to the&nbsp;
                            <a href="https://guardianindonesia.co.id/privacy-policy" class={classes.subscribeLink} target="_blank">
                                Privacy Policy
                            </a>
                            &nbsp;and&nbsp;
                            <a href="https://guardianindonesia.co.id/terms-conditions" class={classes.subscribeLink} target="_blank">
                                Terms &amp; Conditions
                            </a>.
                            </span>
                        }
                        validate={
                            combineValidators(
                                [isRequired],
                                {
                                    id: 'createAccount.subscribeRequired',
                                }
                            )
                        }
                        />
                </div>
                <div className={classes.actions}>
                    {submitButton}
                    {/* {cancelButton} */}
                </div>
            </Form>
        </div>
    );
};

CreateAccount.propTypes = {
    classes: shape({
        actions: string,
        lead: string,
        root: string,
        subscribe: string
    }),
    initialValues: shape({
        email: string,
        firstName: string,
        lastName: string
    }),
    isCancelButtonHidden: bool,
    onSubmit: func,
    onCancel: func
};

CreateAccount.defaultProps = {
    onCancel: () => {},
    isCancelButtonHidden: true
};

export default CreateAccount;
