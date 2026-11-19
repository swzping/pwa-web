import React, { useEffect, useContext, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ChevronLeft, X as CloseIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import compClasses from './mobileHeader.module.css';
import CartTrigger from '../../../../../overrides/venia-ui/components/Header/cartTrigger';

import { HeaderContext } from '../../../../../overrides/peregrine/context/header';

const MobileHeader = props => {
    const {
        showMobileNav = true,
        headerTitle = '',
        redirectHome = false,
        closeIcon = false,
        allowCart = true,
        borderBottom = false
    } = props;
    const { setNavConfig } = useContext(HeaderContext);
    const classes = useStyle(compClasses);
    const { pathname, search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const getHideNav = searchParams.get('hideTopNav');
    const history = useHistory();

    const redirectClick = () => {
        redirectHome ? history.push('/') : history.goBack();
    };

    const borderBottomClasses = borderBottom ? classes.border_bottom : '';

    useEffect(() => {
        return () => {
            setNavConfig({
                showMobileNav: true,
                headerTitle: '',
                redirectHome: false,
                closeIcon: false,
                useCart: true,
                borderBottom: false
            });
        };
    }, [pathname]);

    const isAppShowMobileNav = useMemo(() => {
        if (getHideNav === '1') {
            return true;
        }
        return false;
    }, [getHideNav]);

    return (
        <>
            {showMobileNav && !isAppShowMobileNav ? (
                <div
                    className={`${
                        classes.root
                    } ${borderBottomClasses} hidden-sm`}
                >
                    <div className={classes.iconWrapper}>
                        <button onClick={redirectClick}>
                            {closeIcon ? <CloseIcon /> : <ChevronLeft /> }
                        </button>
                    </div>
                    <p className={classes.title}>{headerTitle}</p>
                    <div className={classes.iconWrapper}>
                        {allowCart ? <CartTrigger /> : null}
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default MobileHeader;
