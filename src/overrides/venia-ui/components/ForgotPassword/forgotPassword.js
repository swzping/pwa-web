import React, { Fragment, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { func, shape, string } from 'prop-types';
import { useLocation } from 'react-router-dom';

import { useForgotPassword } from '@magento/peregrine/lib/talons/ForgotPassword/useForgotPassword';

import FormErrors from '@magento/venia-ui/lib/components/FormError';
import { useStyle } from '@magento/venia-ui/lib/classify';
import ForgotPasswordForm from './ForgotPasswordForm';
import FormSubmissionSuccessful from '@magento/venia-ui/lib/components/ForgotPassword/FormSubmissionSuccessful';

import forgotPasswordOperations from '@magento/venia-ui/lib/components/ForgotPassword/forgotPassword.gql.js';

import defaultClasses from './forgotPassword.module.css';

const ForgotPassword = props => {
    const { initialValues, onCancel } = props;

    const { formatMessage } = useIntl();
    const location = useLocation();
    const talonProps = useForgotPassword({
        onCancel,
        ...forgotPasswordOperations
    });

    const {
        forgotPasswordEmail,
        formErrors,
        handleCancel,
        handleFormSubmit,
        hasCompleted,
        isResettingPassword,
        handleCompletedForgotPassword
    } = talonProps;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const email = params.get('email');
        if (email) {
            handleCompletedForgotPassword(email);
        }
    }, [location.search, handleCompletedForgotPassword]);

    const classes = useStyle(defaultClasses, props.classes);
    const INSTRUCTIONS = formatMessage({
        id: 'forgotPassword.instructions',
        defaultMessage:
            'Please enter the email address associated with this account.'
    });
    const children = hasCompleted ? (
        <FormSubmissionSuccessful email={forgotPasswordEmail} />
    ) : (
        <Fragment>
            <h2 className={classes.title}>
                <FormattedMessage
                    id={'forgotPassword.recoverPasswordText'}
                    defaultMessage={'Recover Password'}
                />
            </h2>
            <p className={classes.instructions}>{INSTRUCTIONS}</p>
            <ForgotPasswordForm
                initialValues={initialValues}
                isResettingPassword={isResettingPassword}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
            />
            <div className={classes.formError}>
                <FormErrors errors={formErrors} />
            </div>
        </Fragment>
    );

    return <div className={classes.root}>{children}</div>;
};

export default ForgotPassword;

ForgotPassword.propTypes = {
    classes: shape({
        instructions: string,
        root: string
    }),
    initialValues: shape({
        email: string
    }),
    onCancel: func
};

ForgotPassword.defaultProps = {
    onCancel: () => {}
};
