export const ORDER_ACTION_TYPES = {
    CANCEL: 'cancel',
    RETURN: 'return',
    RETURN_DETAIL: 'return_detail',
};

export const getLatestOrderReturn = order => {
    const returns = order?.returns?.items || [];
    return returns.reduce((latest, item) => !latest || (item.created_at || '') > (latest.created_at || '') ? item : latest, null);
};

export const getReturnStatusLabel = status => ({
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    GOODS_RETURNED: 'Goods Returned',
    PROCESSING: 'Processing',
    REFUNDED: 'Refunded',
    IN_RETURN_TRANSIT: 'In Return Transit'
}[status] || status || '-');

export const getOrderActionState = detailOrder => {
    const status = (detailOrder?.status || '').toLowerCase();
    const isCanceled = ['canceled', 'cancelled'].includes(status);
    const hasReturnDetail =
        detailOrder?.can_view_return_detail ||
        detailOrder?.can_return_detail ||
        detailOrder?.return_detail ||
        detailOrder?.return_status ||
        getLatestOrderReturn(detailOrder) ||
        /^(return|refund)(_|$)/.test(status);

    if (!isCanceled && hasReturnDetail) {
        return {
            secondaryAction: ORDER_ACTION_TYPES.RETURN_DETAIL,
            secondaryActionLabel: 'Return Detail',
            secondaryActionDisabled: detailOrder?.can_view_return_detail === false || detailOrder?.can_return_detail === false
        };
    }

    if (detailOrder?.available_actions?.includes('CANCEL')) {
        return {
            secondaryAction: ORDER_ACTION_TYPES.CANCEL,
            secondaryActionLabel: 'Cancel Order',
            secondaryActionDisabled: false
        };
    }

    return {
        secondaryAction: detailOrder?.return_eligibility?.can_return === true
            ? ORDER_ACTION_TYPES.RETURN
            : null,
        secondaryActionLabel: 'Return Order',
        secondaryActionDisabled: detailOrder?.return_eligibility?.can_return !== true
    };
};
