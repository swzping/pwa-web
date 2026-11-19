import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/ForgotPassword/FormSubmissionSuccessful/formSubmissionSuccessful.module.css';

const InvalidToken = props => {
    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses, props.classes);

    const textMessage = formatMessage({
        id: 'resetPasswordPage.invalidTokenMessage',
        defaultMessage: 'Token not found or maybe expired.'
    });

    return (
        <div className={classes.root}>
            <h2 className={classes.title}>
                <FormattedMessage
                    id={'resetPasswordPage.invalidTokenText'}
                    defaultMessage={'Can\'t Reset Password'}
                />
            </h2>
            <p className={classes.text}>{textMessage}</p>
        </div>
    );
};

export default InvalidToken;

InvalidToken.propTypes = {
    classes: shape({
        root: string,
        text: string
    }),
    email: string
};
