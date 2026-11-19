import React, { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { func, shape, string } from 'prop-types';


import FormErrors from '@magento/venia-ui/lib/components/FormError';
import { useStyle } from '@magento/venia-ui/lib/classify';

import defaultClasses from '@magento/venia-ui/lib/components/ForgotPassword/forgotPassword.module.css';

import { useNewPassword } from '../../../peregrine/talons/NewPassword/useNewPassword';

import NewPasswordForm from './NewPasswordForm';
import FormSubmissionSuccessful from './FormSubmissionSuccessful';
import InvalidToken from './InvalidToken/invalidToken';

const NewPassword = props => {
    const { onCancel, token } = props;

    const { formatMessage } = useIntl();
    const talonProps = useNewPassword({ onCancel, token });

    const {
        formErrors,
        handleCancel,
        handleFormSubmit,
        hasCompleted,
        hasValidToken,
        isGettingResetPasswordToken,
        isSubmittingNewPassword
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    const INSTRUCTIONS = formatMessage({
        id: 'newPassword.instructions',
        defaultMessage:
            'Please enter your account information below to sign in/sign up!'
    });

    if (!isGettingResetPasswordToken && !hasValidToken) {
        return (
            <div className={classes.root}>
                <InvalidToken />
                <FormErrors errors={formErrors} />
            </div>
        );
    }

    const children = hasCompleted ? (
        <FormSubmissionSuccessful />
    ) : (
        <Fragment>
            <h2 className={classes.title} style={{ fontSize: 22, fontWeight: 700, color: '#212121', lineHeight:'32px', marginBottom: 4}}>
                <FormattedMessage
                    id={'newPassword.recoverPasswordText'}
                    defaultMessage={'CREATE NEW PASSWORD'}
                />
            </h2>
            <p className={classes.instructions} style={{marginBottom: 24}}>{INSTRUCTIONS}</p>
            <NewPasswordForm
                isSubmittingNewPassword={isSubmittingNewPassword}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
            />
            <FormErrors errors={formErrors} />
        </Fragment>
    );

    return <div className={classes.root}>{children}</div>;
};

export default NewPassword;

NewPassword.propTypes = {
    classes: shape({
        instructions: string,
        root: string
    }),
    onCancel: func
};

NewPassword.defaultProps = {
    onCancel: () => {}
};
