import React, { useMemo, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { shape, string } from 'prop-types';
import { useLocation, useHistory } from 'react-router-dom';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import OrderHistoryContextProvider from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';
import { useOrderHistoryPage } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderHistoryPage';
import { useStyle } from '@magento/venia-ui/lib/classify';
import SelectOrderList from './components/selectOrderList';
import Icon from '@magento/venia-ui/lib/components/Icon';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import NoDataPage from '@/modules/custom-modules/components/NoDataPage/noDataPage';
import OrderTabs from '../OrderTabs/orderListTabs';
import OrderListMobileRenderer from './components/orderListMobileRenderer';

import defaultClasses from './accountOrderHistoryMobile.module.css';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const AccountOrderHistoryMobile = props => {
    const talonProps = useOrderHistoryPage();
    const { pathname } = useLocation();
    const history = useHistory();
    const {
        errorMessage,
        loadMoreOrders,
        isBackgroundLoading,
        isLoadingWithoutData,
        orders,
        searchText,
        pageInfo,
        orderLoading,
        statusTab,
        tabList,
        tabIndex,
        handleTabSelect,
        fieldListMap,
        sortCurrent,
        orderSortList,
        handleSortSelect
    } = talonProps;

    const [, { addToast }] = useToasts();

    const classes = useStyle(defaultClasses, props.classes);

    const fieldMap = useMemo(() => {
        return fieldListMap[statusTab];
    }, [statusTab]);

    const handleRowClick = items => {
        const { pdfUrl, order_number } = items || {};
        if (statusTab === 'offline') {
            if (pdfUrl) {
                // 缓存当前状态
                sessionStorage.setItem(
                    'order_history_state',
                    JSON.stringify({
                        tabCurrent: tabIndex,
                        sortCurrent: sortCurrent?.value,
                    })
                );
                history.push(
                    `/preview-invoice-pdf?invoiceUrl=${encodeURIComponent(
                        pdfUrl
                    )}`
                );
            } else {
                addToast({
                    type: 'error',
                    icon: errorIcon,
                    message:
                        'Your receipt is on the way. Please wait and click again',
                    dismissable: true,
                    timeout: 3000
                });
            }
        } else {
            history.push(`/order/${order_number}`);
        }
    };

    const pageContents = useMemo(() => {
        if (isLoadingWithoutData && !orders.length) {
            return <LoadingIndicator global={true} />;
        } else if (!isBackgroundLoading && searchText && !orders.length) {
            return (
                <h3 className={classes.emptyHistoryMessage}>
                    <FormattedMessage
                        id={'orderHistoryPage.invalidOrderNumber'}
                        defaultMessage={`Order "${searchText}" was not found.`}
                        values={{
                            number: searchText
                        }}
                    />
                </h3>
            );
        } else if (!isBackgroundLoading && !orders.length) {
            return (
                <NoDataPage title="Only shows last 6 months receipt records" />
            );
        } else {
            return (
                <OrderListMobileRenderer
                    statusTab={statusTab}
                    orders={orders}
                    classes={classes}
                    fieldMap={fieldMap}
                    onRowClick={items => handleRowClick(items)}
                />
            );
        }
    }, [
        classes.emptyHistoryMessage,
        classes.orderHistoryTable,
        isBackgroundLoading,
        isLoadingWithoutData,
        orders.length,
        searchText,
        tabIndex,
        orderLoading
    ]);

    const loadMoreButton =
        orders?.length && orderLoading ? (
            <>
                <LoadingIndicator global={true} />
                <div className={classes.loadingWrapper}>
                    <Shimmer width="100%" height="40px" />
                </div>
            </>
        ) : null;

    const renderLoadMoreData = () => {
        if (pageInfo?.current >= pageInfo?.total && !orderLoading) {
            return (
                <div className={classes.loadMoreData}>
                    Only shows last 6 months receipt records
                </div>
            );
        }
        return null;
    };

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector('.grid-item:last-child');
        if (lastUserLoaded) {
            const lastUserLoadedOffset =
                lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreOrders &&
                !isBackgroundLoading
            ) {
                loadMoreOrders?.();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    useEffect(() => {
        if (errorMessage) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: errorMessage,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, errorMessage]);

    return (
        <OrderHistoryContextProvider>
            <div className={classes.root}>
                {pathname?.includes('/order-history') ? (
                    <div className={classes.orderTabsWrapper}>
                        <OrderTabs
                            tabConfig={tabList}
                            tabIndex={tabIndex}
                            changeTab={tabKey => handleTabSelect(tabKey)}
                        />
                        {statusTab == 'offline' ? (
                            <div className={classes.offlineSortWrapper}>
                                <SelectOrderList
                                    activeSort={sortCurrent}
                                    dataSource={orderSortList}
                                    onSortSelect={item =>
                                        handleSortSelect(item)
                                    }
                                />
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {pageContents}
                {loadMoreButton}
                {orders?.length ? renderLoadMoreData() : null}
            </div>
        </OrderHistoryContextProvider>
    );
};

export default AccountOrderHistoryMobile;

AccountOrderHistoryMobile.propTypes = {
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
