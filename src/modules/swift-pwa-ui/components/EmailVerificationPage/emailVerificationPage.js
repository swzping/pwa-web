import React, { Fragment } from 'react';
import { shape, string } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import FormErrors from '@magento/venia-ui/lib/components/FormError';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';

import defaultClasses from '@magento/venia-ui/lib/components/ForgotPasswordPage/forgotPasswordPage.module.css';

import { useEmailVerificationPage } from '../../../peregrine/talons/EmailVerificationPage/useEmailVerificationPage';
import InvalidToken from './invalidToken';

const EmailVerificationPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { 
        errors, 
        hasValidToken, 
        isConfirmationCompleted,
        timeoutToSignIn 
    } = useEmailVerificationPage(props);

    const { formatMessage } = useIntl();

    const loadingContent = (
        <div className={classes.root}>
            <LoadingIndicator>
                <FormattedMessage
                    id={'emailVerificationPage.loadingText'}
                    defaultMessage={'Verifying Email'}
                />
            </LoadingIndicator>
        </div>
    );
          
    const content = !hasValidToken
        ? (
            <div className={classes.root}>
                <InvalidToken />
            </div>
        )
        : (
            <div className={classes.root}>
                <h2 className={classes.title}>
                    <FormattedMessage
                        id={'emailVerificationPage.invalidTokenText'}
                        defaultMessage={'Email Verification'}
                    />
                </h2>
                <p className={classes.text}>
                    {formatMessage(
                        {
                            id: 'emailVerificationPage.successMessage',
                            defaultMessage: 'Email Verification Completed. You will be redirect to sign in page in {timeout}s.'
                        },
                        {
                            timeout: timeoutToSignIn
                        }
                    )}
                </p>
            </div>
        );

    return (
        <div className={classes.root}>
            <StoreTitle>
                {formatMessage({
                    id: 'emailVerificationPage.title',
                    defaultMessage: 'Email Verification'
                })}
            </StoreTitle>
            <h1 className={classes.header}>
                <FormattedMessage
                    id="emailVerificationPage.header"
                    defaultMessage="Email Verification"
                />
            </h1>
            <div className={classes.contentContainer}>
                {isConfirmationCompleted ? content : loadingContent}
                <FormErrors errors={errors} />
            </div>
        </div>
    );
};

EmailVerificationPage.defaultProps = {
    signedInRedirectUrl: '/order-history',
    signInPageUrl: '/sign-in'
};

EmailVerificationPage.propTypes = {
    classes: shape({
        root: string,
        header: string,
        contentContainer: string
    }),
    signedInRedirectUrl: string,
    signInPageUrl: string
};

export default EmailVerificationPage;