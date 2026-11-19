import React, { useEffect, useContext } from 'react';
import { shape, string } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useCreateAccountPage } from '@magento/peregrine/lib/talons/CreateAccountPage/useCreateAccountPage';
import { useStyle } from '@magento/venia-ui/lib/classify';
import CreateAccount from '@magento/venia-ui/lib/components/CreateAccount';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';

import { HeaderContext } from '../../../peregrine/context/header';
import defaultClasses from './createAccountPage.module.css';

const CreateAccountPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { createAccountProps } = useCreateAccountPage(props);
    const { formatMessage } = useIntl();
    const { setNavConfig } = useContext(HeaderContext);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'REGISTER',
            closeIcon: true,
            useCart: false,
            borderBottom: true
        });
    }, []);

    return (
        <div className={classes.root}>
            <StoreTitle>
                {formatMessage({
                    id: 'createAccountPage.title',
                    defaultMessage: 'Create an Account'
                })}
            </StoreTitle>
            <h1 className={classes.header}>
                <FormattedMessage
                    id="createAccountPage.header2"
                    defaultMessage="Register"
                />
            </h1>
            <div className={classes.contentContainer}>
                <CreateAccount {...createAccountProps} />
            </div>
        </div>
    );
};

CreateAccountPage.defaultProps = {
    signedInRedirectUrl: '/',
    signInPageUrl: '/sign-in'
};

CreateAccountPage.propTypes = {
    classes: shape({
        root: string,
        header: string,
        contentContainer: string
    }),
    signedInRedirectUrl: string,
    signInPageUrl: string
};

export default CreateAccountPage;
