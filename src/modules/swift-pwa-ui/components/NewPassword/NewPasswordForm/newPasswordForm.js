import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { bool, func, shape, string } from 'prop-types';
import { Form } from 'informed';

import { useStyle } from '@magento/venia-ui/lib/classify';
import {
    isRequired,
    isEqualToField,
    hasLengthAtLeast,
    validatePassword
} from '@magento/venia-ui/lib/util/formValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Password from '@magento/venia-ui/lib/components/Password';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import { useHistory } from 'react-router-dom';

import defaultClasses from './newPasswordForm.module.css';

const NewPasswordForm = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { isSubmittingNewPassword, onSubmit, onCancel } = props;

    const { formatMessage } = useIntl();
    const history = useHistory();

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

    const goLoginInwithEmail = () => {
        history.push('/sign-in?loginType=email');
    }

    if (code) {
        code.addEventListener("keyup", function() {
            checkpassword(code.value);
        });
    }

    return (
        <Form className={classes.root} onSubmit={onSubmit}>
            <Password
                isRequired={true}
                autoComplete="new-password"
                classes={{ root: classes.field_root }}
                field="password"
                isToggleButtonHidden={false}
                label={formatMessage({
                    id: 'NewPasswordForm.passwordText',
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
            <Password
                isRequired={true}
                autoComplete="new-password"
                classes={{ root: classes.field_root }}
                field="password_confirmation"
                isToggleButtonHidden={false}
                label={formatMessage({
                    id: 'NewPasswordForm.confirmationPasswordText',
                    defaultMessage: 'Confirm Password'
                })}
                validate={(value, values) => isEqualToField(value, values, "password")}
                validateOnChange
            />
            <div className={classes.buttonContainer}>
                {/* <Button
                    className={classes.cancelButton}
                    disabled={isSubmittingNewPassword}
                    type="button"
                    priority="low"
                    onClick={onCancel}
                >
                    <FormattedMessage
                        id={'NewPasswordForm.cancelButtonText'}
                        defaultMessage={'Cancel'}
                    />
                </Button> */}
                <Button
                    className={classes.submitButton}
                    disabled={isSubmittingNewPassword}
                    type="submit"
                    priority="high"
                >
                    <FormattedMessage
                        id={'NewPasswordForm.submitButtonText'}
                        defaultMessage={'NEXT'}
                    />
                </Button>
            </div>

            <div className={classes.divider}>
                <div className={classes.dividerLine} />
                <div className={classes.dividerText}>OR</div>
                <div className={classes.dividerLine} />
            </div>

            <div className={classes.emailBlock}>
                <div className={classes.emailText}>
                    {formatMessage({ id: 'phone.haveEmail', defaultMessage: 'If you already have an email account.' })}
                </div>
                <div className={classes.emailButtonWrapper}>
                    <Button
                        priority="low"
                        type="button"
                        className={classes.buttonsCreateAccount}
                        onClick={goLoginInwithEmail}
                        classes={{ root_normalPriority: classes.emailButton }}
                    >
                        <FormattedMessage id="phone.signInWithEmail" defaultMessage="Login with Email" />
                    </Button>
                </div>
            </div>
        </Form>
    );
};

NewPasswordForm.propTypes = {
    classes: shape({
        form: string,
        buttonContainer: string
    }),
    isSubmittingNewPassword: bool,
    onCancel: func.isRequired,
    onSubmit: func.isRequired
};

export default NewPasswordForm;
