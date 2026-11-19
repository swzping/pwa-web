import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { func, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import defaultClasses from './account.module.css';

const Account = props => {
    const { createAccountPageUrl, signInPageUrl } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();

    const handleSignIn = useCallback(() => {
        history.push(signInPageUrl);
    }, [history]);

    const handleCreateAccount = useCallback(() => {
        // history.push(createAccountPageUrl);
        history.push(signInPageUrl);
    }, [history]);

    return (
        <div className={classes.root}>
            <span className={classes.title}>
                <FormattedMessage
                    id={'account.titleText'}
                    defaultMessage={'Sign in or Register'}
                />
            </span>
            <div className={classes.buttonsContainer}>
                <Button priority="high" type="button" onClick={handleSignIn}>
                    <FormattedMessage
                        id={'signIn.signInText'}
                        defaultMessage={'Sign In'}
                    />
                </Button>
                <Button
                    priority="normal"
                    type="button"
                    onClick={handleCreateAccount}
                >
                    <FormattedMessage
                        id={'signIn.createAccountText'}
                        defaultMessage={'Create an Account'}
                    />
                </Button>
            </div>
        </div>
    );
};

export default Account;

Account.defaultProps = {
    createAccountPageUrl: '/create-account',
    signInPageUrl: '/sign-in'
};

Account.propTypes = {
    classes: shape({
        root: string,
        title: string,
        buttonsContainer: string
    }),
    createAccountPageUrl: string,
    signInPageUrl: string,
    handleSignIn: func,
    handleCreateAccount: func
};
