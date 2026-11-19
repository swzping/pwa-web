import React, { useMemo, useEffect, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import {
    Search as SearchIcon,
    AlertCircle as AlertCircleIcon,
    ArrowRight as SubmitIcon
} from 'react-feather';
import { shape, string } from 'prop-types';

import { useToasts } from '@magento/peregrine/lib/Toasts';
import OrderHistoryContextProvider from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';
import { useOrderHistoryPage } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderHistoryPage';
import SelectOrderList from "./components/selectOrderList";
import { useSortChoice } from '@magento/peregrine/lib/hooks/useSort';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import defaultClasses from './accountOrderHistory.module.css';

import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import AccountOrderDetail from './AccountOrderDetail';
import { useLazyQuery } from '@apollo/client';
import OrderTabs from '../OrderTabs/orderListTabs';
import NoDataPage from '@/modules/custom-modules/components/NoDataPage/noDataPage';
import BreadCrumb from './BreadCrumb/breadCrumb';
import OrderListPcRenderer from './components/orderListPcRenderer';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

// 测试状态：'Paid'、'Pending Payment'、'Picking'、'In Transit'、'Completed'、'Canceled'、'Return/Refund'。
// 改为 '' 恢复接口状态，仅开发环境生效。
const TEST_ORDER_STATUS = '';
const withTestStatus = order => order && process.env.NODE_ENV === 'development' && TEST_ORDER_STATUS
    ? { ...order, status: TEST_ORDER_STATUS.toLowerCase().replace(/[ /]+/g, '_').replace('pending_payment', 'pending'), status_label: TEST_ORDER_STATUS }
    : order;

const AccountOrderHistory = props => {
    const talonProps = useOrderHistoryPage();
    const location = useLocation();

    const [openOrder, setOpenOrder] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [cachedOrders, setCachedOrders] = useState(null);
    const [hideOrderTabs, setHideOrderTabs] = useState(false); // 隐藏订单选项卡

    const {
        errorMessage,
        loadMoreOrders,
        // handleReset,
        // handleSubmit,
        isBackgroundLoading,
        isLoadingWithoutData,
        orders,
        pageInfo,
        searchText,
        loadMoreData,
        handleReorder,
        reorderLoading,
        getCustomerOrderDetail,
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
    const { formatMessage } = useIntl();
    const PAGE_TITLE = formatMessage({
        id: 'orderHistoryPage.pageTitleText',
        defaultMessage: 'Order History'
    });

    const [
        loadCustomerOrderDetail,
        {
            data: customerOrderDetailData,
            loading: customerOrderDetailLoading,
            error: customerOrderDetailError
        }
    ] = useLazyQuery(getCustomerOrderDetail, { fetchPolicy: 'network-only' });

    const classes = useStyle(defaultClasses, props.classes);

    //  sessionStorage accountOrderHistory
    useEffect(() => {
        if (orders && orders.length > 0) {
            setCachedOrders(orders);
            try {
                sessionStorage.setItem('accountOrderHistory', JSON.stringify(orders));
            } catch (error) {
                console.log(' sessionStorage accountOrderHistory:', error);
            }
        } else if (!isLoadingWithoutData && !isBackgroundLoading) {
            setCachedOrders(null);
            try {
                sessionStorage.removeItem('accountOrderHistory');
            } catch (error) {
                console.log('e:', error);
            }
        }
    }, [isBackgroundLoading, isLoadingWithoutData, orders]);

    // sessionStorage accountOrderHistory backup
    useEffect(() => {
        try {
            const cachedData = sessionStorage.getItem('accountOrderHistory');
            if (cachedData && !cachedOrders) {
                const parsedOrders = JSON.parse(cachedData);
                setCachedOrders(parsedOrders);
            }
        } catch (error) {
            console.log(' sessionStorage accountOrderHistory backup:', error);
        }
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const orderId = urlParams.get('orderId');

        if (orderId) {
            let ordersToSearch = cachedOrders || orders;

            if (!ordersToSearch || ordersToSearch.length === 0) {
                try {
                    const cachedData = sessionStorage.getItem('accountOrderHistory');
                    if (cachedData) {
                        ordersToSearch = JSON.parse(cachedData);
                    }
                } catch (error) {
                    console.error('get sessionStorage error:', error);
                }
            }

            if (ordersToSearch && ordersToSearch.length > 0) {
                const targetOrder = ordersToSearch.find(order => order.order_number === orderId);

                if (targetOrder) {
                    openDetailHandler(targetOrder);
                    window.history.replaceState({}, '', '/account-information');
                } else {
                    console.log('no found the order');
                }
            } else {
                console.log('no useful order');
            }
        }
    }, [location.search, cachedOrders, orders]);

    const calculateItems = arrayItems =>
        arrayItems?.reduce(
            (accumulator, itemQty) => accumulator + itemQty.quantity_ordered,
            0
        );
    const formatDate = date => {
        const isoFormattedDate = date?.replace(' ', 'T');
        const formattedDate = new Date(isoFormattedDate).toLocaleDateString(
            'id-ID',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );
        return formattedDate;
    };

    const styleStatus = statusPayment => {
        switch ((statusPayment || '').toLowerCase().replace(/[ /-]+/g, '_')) {
            case 'pending':
            case 'pending_payment':
                return {
                    color: '#CC2B1E'
                };
            case 'paid':
            case 'picking':
            case 'in_transit':
                return {
                    color: '#FF8200'
                };
            case 'completed':
                return {
                    color: '#46A147'
                };
            case 'canceled':
            case 'cancelled':
            case 'return_refund':
            case 'refund_pending_approval':
            case 'refund_approved':
            case 'refund_rejected':
            case 'return_in_transit':
            case 'return_in_return_transit':
            case 'return_goods_returned':
            case 'return_processing':
            case 'return_refunded':
                return {
                    color: '#9E9E9E'
                };
            default:
                return {
                    color: '#30383D'
                };
        }
    };

    const openDetailHandler = async order => {
        setOpenOrder(true);
        setHideOrderTabs(true);
        try {
            const result = await loadCustomerOrderDetail({
                variables: {
                    filter: {
                        number: { eq: order.order_number }
                    }
                }
            });
            setDetailOrder(withTestStatus(result.data.customer.orders.items?.[0]));
        } catch (err) {
            console.log(err);
        }
    };

    const handleRowClick = items => {
        if (statusTab === 'offline') {
            if (items?.pdfUrl) {
                return window.open(
                    `/preview-invoice-pdf?invoiceUrl=${encodeURIComponent(
                        items.pdfUrl
                    )}`,
                    '_blank'
                );
            } else {
                addToast({
                    type: 'error',
                    icon: errorIcon,
                    message: 'Your receipt is on the way. Please wait and click again',
                    dismissable: true,
                    timeout: 3000
                });
            }
        } else {
            openDetailHandler(items);
        }
    };

    const closeDetailHandler = () => {
        setOpenOrder(false);
        setHideOrderTabs(false);
    };

    const orderDetail = detailOrder && (
        <>
            <AccountOrderDetail
                detailOrder={detailOrder}
                closeDetailHandler={closeDetailHandler}
                handleReorder={handleReorder}
                reorderLoading={reorderLoading}
            />
        </>
    );

    const fieldMap = useMemo(() => {
        return fieldListMap[statusTab];
    }, [statusTab]);

    const pageContents = useMemo(() => {
        let ordersToDisplay = cachedOrders || orders;

        if (!ordersToDisplay || ordersToDisplay.length === 0) {
            try {
                const cachedData = sessionStorage.getItem('accountOrderHistory');
                if (cachedData) {
                    ordersToDisplay = JSON.parse(cachedData);
                }
            } catch (error) {
                console.log('get sessionStorage error:', error);
            }
        }

        const ordersLength = ordersToDisplay ? ordersToDisplay.length : 0;

        if (isLoadingWithoutData && !orders.length) {
            return <Shimmer width="100%" height="80px" />;
        } else if (!isBackgroundLoading && searchText && !ordersLength) {
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
                <>
                    {!openOrder ? (
                        <table style={{ width: '100%' }}>
                            {ordersLength > 0 ? (
                                <>
                                    <thead>
                                        <tr className={classes.tableHeader}>
                                            <th>Order Number</th>
                                            {statusTab == 'offline' ? (
                                                <th>Store Name</th>
                                            ) : null}
                                            <th>Date</th>
                                            <th>Total Order</th>
                                            {statusTab == 'online' ? (
                                                <th>Total Item</th>
                                            ) : null}
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <OrderListPcRenderer
                                            statusTab={statusTab}
                                            orders={orders}
                                            cachedOrders={statusTab === 'online' ? ordersToDisplay?.map(withTestStatus) : cachedOrders}
                                            fieldMap={fieldMap}
                                            classes={classes}
                                            onRowClick={items =>
                                                handleRowClick(items)
                                            }
                                            styleStatus={styleStatus}
                                            calculateItems={calculateItems}
                                            formatDate={formatDate}
                                        />
                                    </tbody>
                                </>
                            ) : null}
                        </table>
                    ) : (
                        <>{orderDetail}</>
                    )}
                </>
            );
        }
    }, [
        classes.emptyHistoryMessage,
        classes.orderHistoryTable,
        isBackgroundLoading,
        isLoadingWithoutData,
        cachedOrders,
        orders,
        searchText,
        openOrder,
        detailOrder,
        reorderLoading
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

    const handleScroll = () => {
        const lastUserLoaded = document.querySelector(
            '.grid-item-desktop:last-child'
        );

        if (lastUserLoaded) {
            const lastUserLoadedOffset =
                lastUserLoaded.offsetTop + lastUserLoaded.clientHeight;
            const pageOffset = window.pageYOffset + window.innerHeight;
            if (
                pageOffset > lastUserLoadedOffset &&
                !!loadMoreOrders &&
                !isBackgroundLoading
            ) {
                loadMoreOrders();
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

    const renderLoadMoreData = () => {
        if (
            pageInfo?.current >= pageInfo?.total &&
            !orderLoading &&
            !hideOrderTabs
        ) {
            return (
                <div className={classes.loadMoreData}>
                    Only shows last 6 months receipt records
                </div>
            );
        }
        return null;
    };

    return (
        <OrderHistoryContextProvider>
            <div className={classes.root}>
                {location?.pathname?.includes('/order-history') ? (
                    <>
                        <BreadCrumb />
                        {!hideOrderTabs && (
                            <div className={classes.orderTabsWrapper}>
                                <OrderTabs
                                    tabConfig={tabList}
                                    tabIndex={tabIndex}
                                    changeTab={tabKey =>
                                        handleTabSelect(tabKey)
                                    }
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
                        )}
                    </>
                ) : null}
                {pageContents}
                {!openOrder && loadMoreButton}
                {orders?.length ? renderLoadMoreData() : null}
            </div>
        </OrderHistoryContextProvider>
    );
};

export default AccountOrderHistory;

AccountOrderHistory.propTypes = {
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
