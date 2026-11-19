import React, { useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';
import compClasses from './customerAccount.module.css';
// import './customerAccountStyles.css';

const CustomerAccount = () => {
    const classes = useStyle(compClasses);
    const history = useHistory();
    const location = useLocation();
    const [{ isSignedIn }] = useUserContext();

    useEffect(() => {
        if (isSignedIn) {
            if (location.pathname !== '/account-information') {
                history.replace('/account-information');
            }
            return;
        }
        if (
            location.pathname === '/sign-in' ||
            location.pathname.startsWith('/sign-in/')
        ) {
            return;
        }
        history.replace('/sign-in');
    }, [history, isSignedIn, location.pathname]);

    // ⚠️ Abandon logic，It is used as a cover, but it will not be displayed
    return (
        <>
            <div className={classes.root}>
                <p>if you have an account</p>
                <Link
                    to="/sign-in"
                    className={classes.signInButton}
                >
                    LOGIN / REGISTER
                </Link>

                {/* <p>Don't have an account</p>
                <Link
                    to="/create-account"
                    className={classes.createAccountButton}
                >
                    Create Account
                </Link> */}
            </div>

            <div className="customerAccountFooter hidden-desktop">
                <CmsBlock
                    identifiers={['footer_links_block']}
                />
            </div>
        </>
    )
}

export default CustomerAccount
