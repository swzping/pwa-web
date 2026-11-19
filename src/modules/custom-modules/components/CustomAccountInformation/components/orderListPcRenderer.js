import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { RotateCw } from 'react-feather';
import Price from '@magento/venia-ui/lib/components/Price';

/**
 * 深层安全取值
 */
const getValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
};
/**
 * 默认 item 统计方法
 */
const defaultCalculateItems = items =>
    items?.reduce((sum, i) => sum + i.quantity_ordered, 0);

/**
 * 默认日期格式化
 */
const defaultFormatDate = date => {
    const iso = date?.replace(' ', 'T');
    return new Date(iso).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
// The backend owns the payment window; only elapsed time is measured locally.
export const PaymentCountdown = ({ classes, banner = false, order }) => {
    const client = useApolloClient();
    const seconds = order?.payment_countdown;
    const orderNumber = order?.order_number;
    const hidden = seconds == null || order?.payment_methods?.some(method =>
        /bca/i.test(`${method.type || ''} ${method.name || ''}`)
    );
    const [remaining, setRemaining] = useState(seconds);
    const expiredOrder = useRef(null);
    useEffect(() => {
        const refresh = () => client.refetchQueries({ include: ['GetCustomerOrders', 'GetCustomerOrder'] }).catch(() => {});
        const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [client]);
    useEffect(() => {
        setRemaining(seconds);
        if (hidden) return;
        if (seconds > 0) expiredOrder.current = null;
        const started = performance.now();
        const tick = () => {
            const next = Math.max(0, seconds - Math.floor((performance.now() - started) / 1000));
            setRemaining(next);
            if (next === 0 && expiredOrder.current !== orderNumber) {
                expiredOrder.current = orderNumber;
                client.refetchQueries({ include: ['GetCustomerOrders', 'GetCustomerOrder'] }).catch(() => {});
            }
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [seconds, orderNumber, hidden, client, order]);
    if (hidden || remaining == null) return null;
    const time = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60]
        .map(value => String(value).padStart(2, '0')).join(':');

    if (banner) {
        return (
            <div className={classes.paymentDeadlineBanner} role="timer">
                The order will close after {time}
            </div>
        );
    }

    return (
        <span className={classes.paymentCountdown} role="timer" aria-label={`Payment time remaining ${time}`}>
            <span className={classes.paymentCountdownIcon} aria-hidden="true">
                <RotateCw size={16} />
                <span />
            </span>
            {time}
        </span>
    );
};

const OrderListPcRenderer = ({
    statusTab,
    orders,
    cachedOrders,
    fieldMap,
    classes,
    onRowClick,
    styleStatus,
    calculateItems = defaultCalculateItems,
    formatDate = defaultFormatDate
}) => {
    const rows = useMemo(() => {
        let list = cachedOrders || orders;

        if (!list || list.length === 0) {
            try {
                const cached = sessionStorage.getItem('accountOrderHistory');
                if (cached) list = JSON.parse(cached);
            } catch (e) {}
        }

        if (!list || list.length === 0) return [];

        return list.map(order => {
            const orderId = getValue(order, fieldMap.id);
            const date = getValue(order, fieldMap.date);
            const amount = getValue(order, fieldMap.totalValue);
            const currency = getValue(order, fieldMap.totalCurrency);
            const items = getValue(order, fieldMap.items);
            const status = (statusTab === 'online' && order.dfi_display_status?.label) || getValue(order, fieldMap.status);
            const storeNameText = getValue(order, fieldMap.storeName);
            const isPdfUrl =
                statusTab === 'offline' ? { pdfUrl: order.pdfUrl } : {};
            return (
                <tr
                    key={orderId}
                    className={`${classes.tableRowData} grid-item-desktop`}
                >
                    <td
                        onClick={() =>
                            onRowClick({ order_number: orderId, ...isPdfUrl })
                        }
                    >
                        <button className={classes.tableOrderNumber}>
                            #{orderId}
                        </button>
                    </td>
                    {statusTab === 'offline' ? (
                        <td
                            className={classes.orderStoreName}
                            onClick={() =>
                                onRowClick({
                                    order_number: orderId,
                                    ...isPdfUrl
                                })
                            }
                        >
                            {storeNameText}
                        </td>
                    ) : null}

                    <td>{formatDate(date)}</td>
                    {statusTab === 'offline' ? (
                        <td>
                            <Price currencyCode="IDR" value={amount} />
                        </td>
                    ) : (
                        <>
                                <td>
                                    <Price
                                        currencyCode={currency}
                                        value={amount}
                                    />
                                </td>
                        </>
                    )}
                    {statusTab == 'online' && (
                        <td>{calculateItems(items)} Item dibeli</td>
                    )}
                    <td
                        style={statusTab === 'online' && order.dfi_display_status?.color
                            ? { color: order.dfi_display_status.color } : styleStatus(status)}
                        className={classes.tableStatus}
                    >
                        <span className={classes.orderStatusContent}>
                            {status}
                            {statusTab === 'online' && ['pending', 'pending_payment'].includes(
                                (order.status || status || '').toLowerCase().replace(/\s+/g, '_')
                            ) ? (
                                <PaymentCountdown classes={classes} order={order} />
                            ) : null}
                        </span>
                    </td>
                </tr>
            );
        });
    }, [orders, cachedOrders]);

    return rows;
};

export default OrderListPcRenderer;
