import React, { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useOrderDetail } from '../../../peregrine/talons/OrderDetail/useOrderDetail';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import defaultClasses from './orderDetailPage.module.css';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import Price from '@magento/venia-ui/lib/components/Price';
import Items from './items';
import OrderHistoryContextProvider from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import CartProvider from '@magento/peregrine/lib/context/cart';
import UserProvider from '@magento/peregrine/lib/context/user';

const OrderDetailPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { setNavConfig } = useContext(HeaderContext);
    const { number = '' } = useParams();
    const talonProps = useOrderDetail({ number });
    const { 
        data, 
        loading, 
        errorMessage,
        handleReorder,
        reorderLoading
    } = talonProps;

    useEffect(() => {
        setNavConfig({
            headerTitle: `#${number}`,
            useCart: false,
            closeIcon: true,
            borderBottom: true
        });
    }, [number]);

    if (loading) {
        return fullPageLoadingIndicator;
    }
    if (errorMessage) {
        return <ErrorView message={errorMessage} />;
    }

    let order = {};

    if (
        data.customer &&
        data.customer.orders &&
        data.customer.orders.items &&
        data.customer.orders.items.length > 0
    ) {
        order = data.customer.orders.items[0];
    }

    const styleStatus = statusPayment => {
        switch (statusPayment) {
            case 'canceled':
                return {
                    color: '#CCCCCC'
                };
            case 'pending':
                return {
                    color: '#CE383B'
                };
            default:
                return {
                    color: '#30383D'
                };
        }
    };

    const formatDate = date => {
        const isoFormattedDate = date.replace(' ', 'T');
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

    const calculateItems = arrayItems =>
        arrayItems.reduce(
            (accumulator, itemQty) => accumulator + itemQty.quantity_ordered,
            0
        );

    if (!order.id) {
        return <ErrorView message={'Data tidak di temukan'} />;
    }

    return (
        <UserProvider>
            <CartProvider>
                <OrderHistoryContextProvider>
                    <div className={classes.root}>
                        <StoreTitle>Order Detail</StoreTitle>
                        <div className={classes.orderWrapper} key={order.id}>
                            {/* <div className={classes.orderTitleWrapper}>
                                <h3 className={classes.orderNumber}>
                                    #{order.order_number}
                                </h3>
                                <p
                                    style={styleStatus(order.status)}
                                    className={classes.orderStatus}
                                >
                                    {order.status}
                                </p>
                            </div>
                            <div>
                                <p className={classes.orderDate}>
                                    {formatDate(order.created_at)}
                                </p>
                                <div className={classes.orderItems}>
                                    <span className={classes.orderTotalText}>
                                        Total
                                    </span>
                                    <span className={classes.orderTotalSpace}>
                                        <Price
                                            currencyCode={
                                                order.total.grand_total.currency
                                            }
                                            value={order.total.grand_total.value}
                                        />
                                    </span>
                                    <span className={classes.orderTotalSpace}>|</span>
                                    <span>
                                        {calculateItems(order.items)} item dibeli
                                    </span>
                                </div>
                            </div> */}
                            <div className={classes.orderItem}>
                                <Items handleReorder={handleReorder} reorderLoading={reorderLoading} order={order} />
                            </div>
                        </div>
                    </div>
                </OrderHistoryContextProvider>
            </CartProvider>
        </UserProvider>
    );
};

export default OrderDetailPage;
