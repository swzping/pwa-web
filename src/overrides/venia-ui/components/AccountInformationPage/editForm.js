import React, { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Field from '@magento/venia-ui/lib/components/Field';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';
import Password from '@magento/venia-ui/lib/components/Password';
import TextInput from '@magento/venia-ui/lib/components/TextInput';

import {
    isRequired,
    hasLengthAtLeast,
    validatePassword,
    isNotEqualToField,
    validatePhone
} from '@magento/venia-ui/lib/util/formValidators';
import combine from '@magento/venia-ui/lib/util/combineValidators';
import defaultClasses from '@magento/venia-ui/lib/components/AccountInformationPage/editForm.module.css';

const EditForm = props => {
    const {
        classes: propClasses,
        handleChangePassword,
        shouldShowNewPassword
    } = props;
    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, propClasses);
    const passwordLabel = shouldShowNewPassword
        ? formatMessage({
              id: 'global.currentPassword',
              defaultMessage: 'Current Password'
          })
        : formatMessage({
              id: 'global.password',
              defaultMessage: 'Password'
          });

    const maybeNewPasswordField = shouldShowNewPassword ? (
        <>
            <div className={classes.password}>
                <Password
                    fieldName="password"
                    label={passwordLabel}
                    validate={isRequired}
                    autoComplete="current-password"
                    isToggleButtonHidden={false}
                />
            </div>
            <div className={classes.newPassword}>
                <Password
                    fieldName="newPassword"
                    label={formatMessage({
                        id: 'global.newPassword',
                        defaultMessage: 'New Password'
                    })}
                    validate={combine([
                        isRequired,
                        validatePassword,
                        [hasLengthAtLeast, 8],
                        [isNotEqualToField, 'password']
                    ])}
                    isToggleButtonHidden={false}
                />
            </div>
        </>
    ) : null;

    const maybeChangePasswordButton = !shouldShowNewPassword ? (
        <div className={classes.changePasswordButtonContainer}>
            <LinkButton
                classes={classes.changePasswordButton}
                type="button"
                onClick={handleChangePassword}
            >
                <FormattedMessage
                    id={'global.changePassword'}
                    defaultMessage={'Change Password'}
                />
            </LinkButton>
        </div>
    ) : null;

    return (
        <Fragment>
            <div className={classes.root}>
                <div className={classes.firstname}>
                    <Field
                        id="firstname"
                        label={formatMessage({
                            id: 'global.firstName',
                            defaultMessage: 'First Name'
                        })}
                    >
                        <TextInput field="firstname" validate={isRequired} />
                    </Field>
                </div>
                <div className={classes.lastname}>
                    <Field
                        id="lastname"
                        label={formatMessage({
                            id: 'global.lastName',
                            defaultMessage: 'Last Name'
                        })}
                    >
                        <TextInput field="lastname" validate={isRequired} />
                    </Field>
                </div>
                <div className={classes.email}>
                    <Field
                        id="phonenumber"
                        label={formatMessage({
                            id: 'global.phonenumber',
                            defaultMessage: 'Phone Number'
                        })}
                    >
                        <TextInput
                            field="phonenumber"
                            validate={combine([isRequired, validatePhone])}
                        />
                    </Field>
                </div>
                <div className={classes.email}>
                    <Field
                        id="whatsapp_number"
                        label={formatMessage({
                            id: 'global.whatsapp_number',
                            defaultMessage: 'Whatsapp Number'
                        })}
                    >
                        <TextInput
                            field="whatsapp_number"
                            validate={combine([isRequired, validatePhone])}
                        />
                    </Field>
                </div>

                {maybeNewPasswordField}
            </div>
            {maybeChangePasswordButton}
        </Fragment>
    );
};

export default EditForm;

EditForm.propTypes = {
    classes: shape({
        changePasswordButton: string,
        changePasswordButtonContainer: string,
        root: string,
        field: string,
        firstname: string,
        lastname: string,
        phonenumber: string,
        whatsapp_number: string,
        buttons: string,
        passwordLabel: string,
        password: string,
        newPassword: string
    })
};
