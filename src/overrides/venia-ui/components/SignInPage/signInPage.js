import React, { useEffect, useContext, Fragment, useState } from 'react';
import { shape, string } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useSignInPage } from '@magento/peregrine/lib/talons/SignInPage/useSignInPage';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import SignIn from '@magento/venia-ui/lib/components/SignIn';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';

import defaultClasses from './signInPage.module.css';
import { HeaderContext } from '../../../peregrine/context/header';

//
const SignInPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { signInProps } = useSignInPage(props);
    const { formatMessage } = useIntl();
    const { setNavConfig } = useContext(HeaderContext);
    const history = useHistory();

    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const resizePhone = () => {
        window.onresize = function () {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'Welcome to Guardian',
            showMobileNav: true,
            closeIcon: true,
            useCart: false,
            borderBottom: true
        });
    }, []);

    return (
        <Fragment>
            <div className={classes.root}>
                <StoreTitle>
                    {formatMessage({
                        id: 'signInPage.title',
                        defaultMessage: 'Sign In'
                    })}
                </StoreTitle>
                <div className={classes.contentContainer}>
                    <SignIn {...signInProps} redirectNotifyMe={history.location.search} />
                </div>
            </div>
            {!isPhone && (<div className="customerAccountFooter hidden-desktop">
                <CmsBlock identifiers={['footer_links_block']} />
            </div>)}
        </Fragment>
    );
};

SignInPage.defaultProps = {
    createAccountPageUrl: '/create-account',
    forgotPasswordPageUrl: '/forgot-password'
    // signedInRedirectUrl: '/account-information'
};

SignInPage.propTypes = {
    classes: shape({
        root: string,
        header: string,
        contentContainer: string
    }),
    createAccountPageUrl: string,
    forgotPasswordPageUrl: string
    // signedInRedirectUrl: string
};

export default SignInPage;
