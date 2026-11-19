import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { func, shape, string } from 'prop-types';
import { Form } from 'informed';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { isRequired } from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import Button from '@magento/venia-ui/lib/components/Button';
import Field from '@magento/venia-ui/lib/components/Field';
import TextInput from '@magento/venia-ui/lib/components/TextInput';
import defaultClasses from './forgotPasswordForm.module.css';

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const validateEmail = value => {
    if (value && !emailRegex.test(value)) {
        return {
            id: 'email.invalid',
            defaultMessage:
                'The email address format seems incorrect, please check it.'
        };
    }
    return undefined;
};

const ForgotPasswordForm = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { initialValues, isResettingPassword, onSubmit, onCancel } = props;

    const { formatMessage } = useIntl();

    return (
        <Form
            className={classes.root}
            initialValues={initialValues}
            onSubmit={onSubmit}
        >
            <Field
                label={formatMessage({
                    id: 'forgotPasswordForm.emailAddressText',
                    defaultMessage: 'Email Address'
                })}
            >
                <TextInput
                    autoComplete="email"
                    field="email"
                    validate={combine([isRequired, validateEmail])}
                />
            </Field>
            <div className={classes.buttonContainer}>
                <Button
                    className={classes.cancelButton}
                    disabled={isResettingPassword}
                    type="button"
                    priority="low"
                    onClick={onCancel}
                >
                    <FormattedMessage
                        id={'forgotPasswordForm.cancelButtonText'}
                        defaultMessage={'Cancel'}
                    />
                </Button>
                <Button
                    className={classes.submitButton}
                    disabled={isResettingPassword}
                    type="submit"
                    priority="high"
                >
                    <FormattedMessage
                        id={'forgotPasswordForm.submitButtonText'}
                        defaultMessage={'Submit'}
                    />
                </Button>
            </div>
        </Form>
    );
};

ForgotPasswordForm.propTypes = {
    classes: shape({
        form: string,
        buttonContainer: string
    }),
    initialValues: shape({
        email: string
    }),
    onCancel: func.isRequired,
    onSubmit: func.isRequired
};

ForgotPasswordForm.defaultProps = {
    initialValues: {}
};

export default ForgotPasswordForm;
