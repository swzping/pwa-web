import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef
} from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { useAppContext } from '@magento/peregrine/lib/context/app';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useToasts } from '@magento/peregrine';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import Icon from '@magento/venia-ui/lib/components/Icon';
import DEFAULT_OPERATIONS, {
    GET_REORDER_ITEMS_DATA
} from './orderHistoryPage.gql';
import { saveCartId } from '@magento/peregrine/lib/store/actions/cart/asyncActions';

const errorIcon = (
    <Icon
        src={AlertCircleIcon}
        attrs={{
            width: 18
        }}
    />
);

const PAGE_SIZE = 10;

const ORDER_LIST_FIELD_MAP = {
    online: {
        id: 'order_number',
        date: 'created_at',
        status: 'status_label',
        totalValue: 'total.grand_total.value',
        totalCurrency: 'total.grand_total.currency',
        items: 'items'
    },
    offline: {
        id: 'receiptNo',
        storeName: 'storeName',
        date: 'timestamp',
        status: 'orderStatus',
        totalValue: 'totalAmount'
    }
};

const ORDER_SORT_LIST = [
    {
        value: 'NORMAL',
        label: (
            <FormattedMessage
                id={'orderListSort.Purchased'}
                defaultMessage={'Purchased'}
            />
        )
    },
    {
        value: 'REFUND',
        label: (
            <FormattedMessage
                id={'orderListSort.Refund'}
                defaultMessage={'Refund'}
            />
        )
    }
];
export const useOrderHistoryPage = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const {
        getCustomerOrdersQuery,
        getCustomerOrderDetail,
        getOfflineOrderListQuery
    } = operations;
    const [, { addToast }] = useToasts();

    const [
        ,
        {
            actions: { setPageLoading }
        }
    ] = useAppContext();
    const lockLoadingRef = useRef(false);
    const [tabCurrent, setTabCurrent] = useState(0); // 当前订单标签页
    const [sortCurrent, setSortCurrent] = useState(ORDER_SORT_LIST[0]); // 当前线下订单排序
    const [currentPage, setCurrentPage] = useState(1);
    const [orderList, setOrderList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [reorderLoading, setReorderLoading] = useState(false);

    useEffect(() => {
        const cache = sessionStorage.getItem('order_history_state');
        if (!cache) return;
        try {
            const parsed = JSON.parse(cache);
            const sortItem =
                ORDER_SORT_LIST.find(i => i.value === parsed.sortValue) ||
                ORDER_SORT_LIST[0];
            setTabCurrent(parsed.tabCurrent || 0); // 设置当前订单标签页
            setSortCurrent(sortItem); // 设置当前线下订单排序
        } finally {
            sessionStorage.removeItem('order_history_state');
        }
    }, []);

    const tabConfig = [
        { key: 'online', label: 'Online' },
        { key: 'offline', label: 'Offline' }
    ];

    const statusTab = useMemo(() => {
        return tabConfig[tabCurrent].key;
    }, [tabCurrent, tabConfig]);

    const activeQuery = useMemo(() => {
        switch (statusTab) {
            case 'online':
                return getCustomerOrdersQuery;
            case 'offline':
                return getOfflineOrderListQuery;
            default:
                return getCustomerOrdersQuery;
        }
    }, [statusTab]);

    useEffect(() => {
        statusTab === 'offline' ? setCurrentPage(0) : setCurrentPage(1);
    }, [statusTab]);

    const variables = useMemo(() => {
        if (statusTab === 'offline') {
            return {
                input: {
                    page: currentPage,
                    pageSize: PAGE_SIZE,
                    orderType: sortCurrent?.value || 'NORMAL'
                }
            };
        }
        return {
            filter: {
                number: { match: searchText }
            },
            currentPage: currentPage,
            pageSize: PAGE_SIZE
        };
    }, [statusTab, searchText, sortCurrent, currentPage]);

    const {
        data: orderData,
        error: getOrderError,
        loading: orderLoading
    } = useQuery(activeQuery, {
        fetchPolicy: 'cache-and-network',
        variables
    });

    const [
        reOrder,
        { called: applyReorderCalled, loading: appliyingReorder }
    ] = useMutation(GET_REORDER_ITEMS_DATA);

    useEffect(() => {
        if (applyReorderCalled) {
            setReorderLoading(appliyingReorder);
        }
    }, [applyReorderCalled, appliyingReorder, setReorderLoading]);

    const orderSelector = useMemo(() => {
        if (!orderData) {
            return {
                items: [],
                current_page: 1,
                total_pages: 1,
                total_count: 0
            };
        }
        // offline 订单结构
        if (statusTab === 'offline') {
            const orders = orderData?.getOfflineOrderList?.data || {};
            return {
                items: orders.items || [],
                current_page: orders.page + 1 || 1,
                total_pages: orders.totalPage || 1,
                total_count: orders.totalCount || 0
            };
        }
        // online 订单结构
        const orders = orderData.customer?.orders || {};

        return {
            items: orders.items || [],
            current_page: orders.current_page || 1,
            total_pages: orders.total_pages || 1,
            total_count: orders.total_count || 0
        };
    }, [orderData, statusTab]);

    const { items: orders } = orderSelector; // 线上/线下订单新逻辑
    // const orders = orderData ? orderData.customer.orders.items : [];
    const mergeOrdersByKey = (prev, next, key = 'order_number') => {
        const map = new Map();
        prev.forEach(item => map.set(item[key], item));
        next.forEach(item => {
            if (!map.has(item[key])) {
                map.set(item[key], item);
            }
        });

        return Array.from(map.values());
    };

    useEffect(() => {
        const mergeKey = statusTab === 'offline' ? 'receiptNo' : 'order_number';
        const firstPageMap = {
            offline: 0, // CEP分页从0开始
            online: 1 // 线上分页从1开始
        };
        const isFirstPage = currentPage === firstPageMap[statusTab];
        setOrderList(prevList => {
            return isFirstPage
                ? orders
                : mergeOrdersByKey(prevList, orders, mergeKey);
        });
    }, [orders, statusTab, currentPage]);

    useEffect(() => {
        if (!orderLoading) {
            lockLoadingRef.current = false;
        }
    }, [orderLoading]);

    const isLoadingWithoutData = !orderData && orderLoading;
    const isBackgroundLoading = !!orderData && orderLoading;

    const pageInfo = useMemo(() => {
        const { total_count } = orderSelector;

        return {
            current: orderList.length,
            total: total_count
        };
    }, [orderSelector, currentPage, orderList]);

    const derivedErrorMessage = useMemo(
        () => deriveErrorMessage([getOrderError]),
        [getOrderError]
    );

    const handleReset = useCallback(() => {
        setSearchText('');
    }, []);

    const handleSubmit = useCallback(({ search }) => {
        setSearchText(search);
    }, []);

    // infinite scroll function
    const loadMoreData = () => {
        if (
            window.innerHeight + document.documentElement.scrollTop ===
            document.scrollingElement.scrollHeight
        ) {
            if (orderData) {
                const { current_page, total_pages } = orderSelector;
                if (current_page < total_pages) {
                    setCurrentPage(prevPage => prevPage + 1);
                }
            }
        }
    };

    const loadMoreOrders = () => {
        if (lockLoadingRef.current) return;
        if (orderData && !orderLoading) {
            const { current_page, total_pages } = orderSelector;
            if (current_page < total_pages) {
                lockLoadingRef.current = true;
                setCurrentPage(prevPage => prevPage + 1);
            }
        }
    };

    // Update the page indicator if the GraphQL query is in flight.
    useEffect(() => {
        setPageLoading(isBackgroundLoading);
    }, [isBackgroundLoading, setPageLoading]);

    // handle reorder Click
    const handleReorder = async orderId => {
        try {
            const { data } = await reOrder({
                variables: {
                    orderNumber: orderId
                }
            });
            const cartId = data?.reorderItems?.cart?.id;
            if (cartId) {
                saveCartId(cartId);
                window.location.href = '/cart';
            }
        } catch (error) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: 'update failed',
                dismissable: true,
                timeout: 10000
            });
        }
    };

    const handleTabSelect = useCallback(
        index => {
            if (orderLoading) return;
            setTabCurrent(index);
        },
        [orderLoading]
    );

    const handleSortSelect = item => {
        setSortCurrent(item);
        setCurrentPage(0);
    };

    return {
        errorMessage: derivedErrorMessage,
        handleReset,
        handleSubmit,
        isBackgroundLoading,
        isLoadingWithoutData,
        loadMoreOrders,
        orders: orderList,
        pageInfo,
        searchText,
        loadMoreData,
        handleReorder,
        reorderLoading,
        getCustomerOrderDetail,
        orderLoading,
        statusTab,
        tabList: tabConfig,
        tabIndex: tabCurrent,
        handleTabSelect,
        fieldListMap: ORDER_LIST_FIELD_MAP,
        sortCurrent: sortCurrent,
        orderSortList: ORDER_SORT_LIST,
        handleSortSelect
    };
};
