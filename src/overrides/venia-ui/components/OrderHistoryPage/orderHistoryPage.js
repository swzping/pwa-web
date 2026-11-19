import React, { useEffect, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import {
    Search as SearchIcon,
    AlertCircle as AlertCircleIcon,
    ArrowRight as SubmitIcon
} from 'react-feather';
import { shape, string } from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import OrderHistoryContextProvider from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';
import { useWindowResize } from '@/helpers/useWindowResize';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';

import { StoreTitle } from '@magento/venia-ui/lib/components/Head';

import defaultClasses from './orderHistoryPage.module.css';

import { HeaderContext } from '../../../peregrine/context/header';
import AccountOrderHistory from '../../../../modules/custom-modules/components/CustomAccountInformation/AccountOrderHistory';
import AccountOrderHistoryMobile from '../../../../modules/custom-modules/components/CustomAccountInformation/AccountOrderHistoryMobile';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);
const OrderHistoryPage = props => {
    const { pathname } = useLocation();
    const isMobile = useWindowResize({ delay: 500 });
    const { setNavConfig } = useContext(HeaderContext);
    const [, { addToast }] = useToasts();
    const { formatMessage } = useIntl();
    const PAGE_TITLE = formatMessage({
        id: 'orderHistoryPage.pageTitleText',
        defaultMessage: 'Order History'
    });

    const classes = useStyle(defaultClasses, props.classes);

    useEffect(() => {
        setNavConfig({
            headerTitle: 'My Orders',
            useCart: false,
            showMobileNav: false,
            closeIcon: false,
            borderBottom: true
        });
    }, [pathname]);

    return (
        <OrderHistoryContextProvider>
            <div className={classes.root}>
                <StoreTitle>{PAGE_TITLE}</StoreTitle>
                {isMobile ? (
                    <AccountOrderHistoryMobile />
                ) : (
                    <AccountOrderHistory />
                )}
            </div>
        </OrderHistoryContextProvider>
    );
};

export default OrderHistoryPage;

OrderHistoryPage.propTypes = {
    classes: shape({
        root: string,
        heading: string,
        emptyHistoryMessage: string,
        orderHistoryTable: string,
        search: string,
        searchButton: string,
        submitIcon: string,
        loadMoreButton: string
    })
};
