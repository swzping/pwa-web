import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/ForgotPassword/FormSubmissionSuccessful/formSubmissionSuccessful.module.css';

const FormSubmissionSuccessful = props => {
    const { email } = props;
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, props.classes);

    const textMessage = formatMessage(
        {
            id: 'formSubmissionNewPasswordSuccessful.textMessage',
            defaultMessage:
                'Reset password success, you can login with your new password.'
        },
        { email }
    );

    return (
        <div className={classes.root}>
            <h2 className={classes.title}>
                <FormattedMessage
                    id={'formSubmissionNewPasswordSuccessful.recoverPasswordText'}
                    defaultMessage={'Reset Password'}
                />
            </h2>
            <p className={classes.text}>{textMessage}</p>
        </div>
    );
};

export default FormSubmissionSuccessful;

FormSubmissionSuccessful.propTypes = {
    classes: shape({
        root: string,
        text: string
    }),
    email: string
};
