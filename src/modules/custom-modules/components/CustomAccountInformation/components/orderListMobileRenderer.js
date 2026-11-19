import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Price from '@magento/venia-ui/lib/components/Price';
import { ChevronRightOutlineNotFill } from '@/assets/icons';

const getValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

const OrderListMobileRenderer = ({
    orders = [],
    fieldMap = {},
    classes,
    statusTab,
    onRowClick
}) => {
    const {
        id,
        status,
        date,
        totalCurrency,
        totalValue,
        items,
        storeName
    } = fieldMap;

    const calculateItems = itemsArr =>
        itemsArr?.reduce((acc, item) => acc + (item.quantity_ordered || 1), 0);
    const formatDate = dateStr => {
        if (!dateStr) return '';
        const iso = dateStr.replace(' ', 'T');
        return new Date(iso).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const styleStatus = statusValue => {
        switch (statusValue) {
            case 'canceled':
                return { color: '#CCCCCC' };
            case 'pending':
                return { color: '#CE383B' };
            default:
                return { color: '#30383D' };
        }
    };

    const rows = useMemo(() => {
        return orders.map(order => {
            const orderId = getValue(order, id);
            const orderStatus = (statusTab === 'online' && order.dfi_display_status?.label) || getValue(order, status);
            const orderDate = getValue(order, date);
            const currency = getValue(order, totalCurrency);
            const amount = getValue(order, totalValue);
            const orderItems = getValue(order, items);
            const storeNameText = getValue(order, storeName);
            const isPdfUrl =
                statusTab === 'offline' ? { pdfUrl: order.pdfUrl } : {};
            return (
                <div
                    key={orderId}
                    className={`${classes.orderWrapper} grid-item`}
                >
                    {statusTab === 'offline' ? (
                        <div
                            className={classes.orderStoreName}
                            onClick={() =>
                                onRowClick({
                                    order_number: orderId,
                                    ...isPdfUrl
                                })
                            }
                        >
                            {storeNameText}
                        </div>
                    ) : null}
                    <div
                        className={classes.orderTitleWrapper}
                        onClick={() =>
                            onRowClick({ order_number: orderId, ...isPdfUrl })
                        }
                    >
                        <h3 className={classes.orderNumber}>#{orderId}</h3>

                        <p
                            style={statusTab === 'online' && order.dfi_display_status?.color
                                ? { color: order.dfi_display_status.color } : styleStatus(orderStatus)}
                            className={classes.orderStatus}
                        >
                            {orderStatus}
                        </p>
                    </div>

                    <p
                        className={classes.linkDetail}
                        onClick={() =>
                            onRowClick({ order_number: orderId, ...isPdfUrl })
                        }
                    >
                        <p className={classes.orderDate}>
                            {formatDate(orderDate)}
                        </p>
                        {statusTab === 'offline' ? (
                            <div className={classes.orderItems}>
                                <span className={classes.orderTotalText}>
                                    Total
                                </span>
                                <span className={classes.orderTotalSpace}>
                                    <Price currencyCode="IDR" value={amount} />
                                </span>
                                <span className={classes.rightIcon}>
                                    <ChevronRightOutlineNotFill
                                        style={{
                                            fontSize: 14,
                                            color: '#616161'
                                        }}
                                    />
                                </span>
                            </div>
                        ) : (
                            <div className={classes.orderItems}>
                                <span className={classes.orderTotalText}>
                                    Total
                                </span>
                                {currency && amount ? (
                                    <span className={classes.orderTotalSpace}>
                                        <Price
                                            currencyCode={currency}
                                            value={amount}
                                        />
                                    </span>
                                ) : (
                                    <span className={classes.orderTotalSpace}>
                                        {amount}
                                    </span>
                                )}
                                <span className={classes.orderTotalSpace}>
                                    |
                                </span>
                                <span>
                                    {calculateItems(orderItems)} item dibeli
                                </span>
                                <span className={classes.rightIcon}>
                                    <ChevronRightOutlineNotFill
                                        style={{
                                            fontSize: 14,
                                            color: '#616161'
                                        }}
                                    />
                                </span>
                            </div>
                        )}
                    </p>
                </div>
            );
        });
    }, [orders]);

    return <ul className={classes.orderHistoryTable}>{rows}</ul>;
};

export default OrderListMobileRenderer;
