import React from 'react';
import { shape, string } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import defaultClasses from '@magento/venia-ui/lib/components/ForgotPasswordPage/forgotPasswordPage.module.css';

import { useResetPasswordPage } from '../../../peregrine/talons/ResetPasswordPage/useResetPasswordPage';
import NewPassword from '../NewPassword';

const ResetPasswordPage = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const { formatMessage } = useIntl();
    const { resetPasswordProps } = useResetPasswordPage(props);

    return (
        <div className={classes.root}>
            <StoreTitle>
                {formatMessage({
                    id: 'resetPasswordPage.title',
                    defaultMessage: 'Reset Your Password?'
                })}
            </StoreTitle>
            { !resetPasswordProps?.token && (<h1 className={classes.header}>
                <FormattedMessage
                    id="resetPasswordPage.header"
                    defaultMessage="Reset Your Password?"
                />
            </h1>)
            }
            <div className={classes.contentContainer}>
                <NewPassword {...resetPasswordProps} />
            </div>
        </div>
    );
};

ResetPasswordPage.defaultProps = {
    signedInRedirectUrl: '/order-history',
    signInPageUrl: '/sign-in'
};

ResetPasswordPage.propTypes = {
    classes: shape({
        root: string,
        header: string,
        contentContainer: string
    }),
    signedInRedirectUrl: string,
    signInPageUrl: string
};

export default ResetPasswordPage;
