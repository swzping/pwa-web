import React from 'react';
import OrderDetails from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails'
import { useOrderRow } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderRow';

const Item = (props) => {
    const { order, handleReorder, reorderLoading } = props;
    const {
        invoices,
        items,
        number: orderNumber,
        order_date: orderDate,
        shipments,
        status,
        total
    } = order;

    const talonProps = useOrderRow({ items });
    const { loading, isOpen, handleContentToggle, imagesData } = talonProps;

    return <OrderDetails handleReorder={handleReorder} reorderLoading={reorderLoading} orderData={order} imagesData={imagesData} />
}

export default Item;
