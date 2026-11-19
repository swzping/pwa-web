import React, { useEffect, useMemo, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useOrderRow } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderRow';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import Price from '@magento/venia-ui/lib/components/Price';
import Button from '@magento/venia-ui/lib/components/Button';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import defaultClasses from './accountOrderHistory.module.css';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';
import { Link, useHistory } from 'react-router-dom';
import { useOrderHistoryContext } from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryContext';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import ShippingInformation from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/shippingInformation';
import PaymentMethod from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/paymentMethod';
import ShippingMethod from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/shippingMethod';
import { FormattedMessage } from 'react-intl';
import { detailFormatDate } from '../../../peregrine/hooks/detailFormatDate';
import BreadcrumbNavigation from '../../../../overrides/venia-ui/components/AccountInformationPage/BreadcrumbNavigation';
import { LocationIcon, RightArrow, WarningOutlineIcon } from '../../../../assets/icons';
import CartFreeGift from '../../../swift-pwa-ui/components/FreeGift/CartFreeGift';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { GET_INVOICE_URL } from '../../../../overrides/venia-ui/components/OrderHistoryPage/OrderDetails/orderDetails.gql';
import { getOrderActionState, getLatestOrderReturn, getReturnStatusLabel, ORDER_ACTION_TYPES } from './orderActionState';
import CancelOrderReasonModal from './CancelOrderReasonModal';
import ReturnProductModal from './ReturnProductModal';
import { PaymentCountdown } from './components/orderListPcRenderer';

const errorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

const MINUS_SYMBOL = '-';

const AccountOrderDetail = props => {
    const {
        detailOrder: originalDetailOrder,
        closeDetailHandler,
        handleReorder,
        reorderLoading
    } = props;
    const [cancelResult, setCancelResult] = useState(null);
    const [showCancelToast, setShowCancelToast] = useState(false);
    const detailOrder = cancelResult?.orderNumber === originalDetailOrder.order_number
        ? { ...originalDetailOrder, ...cancelResult.order }
        : originalDetailOrder;

    useEffect(() => {
        if (!showCancelToast) return;
        const timer = setTimeout(() => setShowCancelToast(false), 2000);
        return () => clearTimeout(timer);
    }, [showCancelToast]);

    const isOrderCanceled = ['canceled', 'cancelled'].includes(detailOrder.status);
    const returnRequest = getLatestOrderReturn(detailOrder);
    const isReturnRefund = Boolean(returnRequest);
    const isRefundOnly = returnRequest?.solution?.code === 'REFUND_ONLY';
    const returnApproval = getReturnStatusLabel(returnRequest?.display_status);

    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();
    const [{ currentUser }] = useUserContext();
    const [, { addToast }] = useToasts();
    const [isCancelReasonModalOpen, setIsCancelReasonModalOpen] = useState(false);
    const [isReturnProductModalOpen, setIsReturnProductModalOpen] = useState(false);

    const { items, detail, total } = detailOrder;
    const { discounts } = total;

    const orderHistoryState = useOrderHistoryContext();
    const { productURLSuffix } = orderHistoryState;


    const talonProps = useOrderRow({ items });
    const { loading, imagesData } = talonProps;

    const [getInvoiceUrl, { loading: invoiceLoading }] = useLazyQuery(GET_INVOICE_URL, {
        fetchPolicy: 'network-only'
    });

    const discountRowElement = useMemo(() => {
        if (!discounts || !discounts.length) {
            return null;
        }

        const discountTotal = {
            currency: discounts[0].amount.currency,
            value: discounts.reduce(
                (acc, discount) => acc + discount.amount.value,
                0
            )
        };

        return (
            <>
                <p className={classes.discountTag}>
                    <FormattedMessage
                        id="orderDetails.discountCart"
                        defaultMessage="Discount"
                    />
                </p>
                <p className={classes.discountTagPrice}>
                    -
                    {' '}
                    <Price
                        value={discountTotal.value}
                        currencyCode={discountTotal.currency}
                    />
                </p>
            </>
        );
    }, [classes.discount, discounts]);

    if (loading) {
        return (
            <>
                <div className="mb-3">
                    <Shimmer key="test-name" width="100%" height="80px" />
                </div>
                <div>
                    <Shimmer key="test-name" width="100%" height="200px" />
                </div>
            </>
        );
    }

    const calculateItems = arrayItems =>
        arrayItems
            .filter(item => !item.is_gwp)
            .reduce(
                (accumulator, itemQty) =>
                    accumulator + itemQty.quantity_ordered,
                0
            );
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

    const linkUrl = (product_url_key) => {
        if (product_url_key) {
            return `/${product_url_key}${productURLSuffix}`;
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        const street = addr.street?.join(', ') || '';
        return `${street}, ${addr.city || ''}, ${addr.region || ''} ${addr.postcode || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
    };

    const handleDeliveryDetailsClick = () => {

        const params = {
            email: currentUser?.email || '',
            orderId: detailOrder.order_number,
            orderStatus: detailOrder.status_label || ''
        };

        history.push({
            pathname: `/account-information/order/${detailOrder.order_number}`,
            state: params
        });
    };

    const handleDownloadInvoice = async () => {
        try {
            const result = await getInvoiceUrl({
                variables: { orderIncrementId: detailOrder.order_number }
            });
            if (result.data?.invoiceUrl) {
                window.open(result.data.invoiceUrl, '_blank');
            } else {
                addToast({
                    type: 'error',
                    icon: errorIcon,
                    message: 'Invoice URL not found',
                    dismissable: true,
                    timeout: 7000
                });
            }
        } catch (err) {
            console.error('Failed to get invoice URL:', err);
            addToast({
                type: 'error',
                icon: errorIcon,
                message: 'Failed to download invoice. Please try again later.',
                dismissable: true,
                timeout: 7000
            });
        }
    };

    const isOrderCompleted = detailOrder?.status === 'completed';
    const orderActionState = getOrderActionState(detailOrder);

    const handleSecondaryOrderAction = () => {
        if (orderActionState.secondaryActionDisabled) return;
        if (orderActionState.secondaryAction === ORDER_ACTION_TYPES.CANCEL) {
            setIsCancelReasonModalOpen(true);
            return;
        }

        if (orderActionState.secondaryAction === ORDER_ACTION_TYPES.RETURN) {
            setIsReturnProductModalOpen(true);
            return;
        }

        if (orderActionState.secondaryAction === ORDER_ACTION_TYPES.RETURN_DETAIL) {
            history.push({
                pathname: `/order-return/${detailOrder.order_number}`,
                search: '?mode=view',
                state: {
                    mode: 'view'
                }
            });
        }
    };

    const handleCancelReasonConfirm = (order, reason) => {
        setCancelResult({ orderNumber: detailOrder.order_number, order, reason });
        setIsCancelReasonModalOpen(false);
        setShowCancelToast(true);
    };

    const handleReturnProductNext = selectedItems => {
        setIsReturnProductModalOpen(false);
        history.push({
            pathname: `/order-return/${detailOrder.order_number}`,
            state: {
                mode: 'create',
                selectedItemIds: selectedItems.map(item => item.id)
            }
        });
    };

    // BCA/Mandiri VA（name/type 含 bca 或 mandiri，不区分大小写）&& 订单状态为待付款 status pending_payment / pending 都能命中
    const paymentMethod = detailOrder?.payment_methods?.[0] || {};
    const isVaOrPendingPayment =
        /bca|mandiri/i.test(
            `${paymentMethod.name || ''} ${paymentMethod.type || ''}`
        ) && detailOrder?.status === 'pending_payment';

    const orderComments = (detailOrder.comments && detailOrder.comments.length > 0) ? (
        <div className={classes.commentContainer}>
            <p className={classes.commentTitle}>
                <FormattedMessage
                    id="orderDetails.comments"
                    defaultMessage="About Your Order"
                />
            </p>
            <div>
                {
                    detailOrder.comments.map((comment, idx) => (
                        <div className={classes.commentWrapper} key={idx}>
                            <p className={classes.commentDate}>
                                {detailFormatDate(comment.timestamp)}
                            </p>
                            <p className={classes.commentText}>{comment.message}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    ) : null;

    const customizableOptions = (item) => {
        if (item.entered_options && item.entered_options.length > 0) {
            return (
                <>
                    {item.entered_options.map((item, index) => (
                        <div style={{ fontWeight: 'normal' }} key={index}>
                            <span>
                                <span>
                                    {item.label}:
                                </span>
                                {' '}
                                <span>
                                    {item.value}
                                </span>
                            </span>
                        </div>
                    ))}
                </>
            )
        } else {
            return null;
        }
    };

    const bundleOptions = (item) => {
        if (item.bundle_options && item.bundle_options.length > 0) {
            return (
                <div>
                    {item.bundle_options.map((val, idx) => (
                        <div style={{ fontWeight: 'normal' }} key={idx}>
                            <span>
                                {val.label}
                            </span>{' '}
                            :
                            <div>
                                {val.values.map((item, idt) => (
                                    <div style={{ fontSize: '12px' }} key={idt}>
                                        {item.product_name}
                                        {' + '}
                                        <strong>
                                            <Price
                                                currencyCode={'IDR'}
                                                value={item.price.value}
                                            />
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )
        } else {
            return null;
        }
    };

    const shippingMethodData = {
        shippingMethod: detailOrder.shipping_method,
        shipments: detailOrder.shipments,
        pickupStoreAddress: detailOrder.pickup_store_address
    };


    const imageSrc = product_sku => {
        if (imagesData[product_sku]) {
            return imagesData[product_sku].thumbnail.url;
        }
    };

    const promotionsList = detailOrder.promotions?.map((promotion, index) => (
        <div key={index} className={`${classes.priceSummary} d-flex justify-content-between align-items-center`}>
            <p className={classes.discountTag}>{promotion.label}</p>
            <p className={classes.discountTagPrice}>
                {MINUS_SYMBOL}
                <Price
                    value={promotion.amount.value}
                    currencyCode={promotion.amount.currency}
                />
            </p>
        </div>
    ));

    const studentPassTag = (
        <div className={`${classes.priceSummary} d-flex justify-content-between align-items-center`}>
            <p className={[classes.discountTag].join(' ')} style={{ backgroundColor: '#ffd38b' }}>Student discount</p>
            <p className={[classes.discountTagPrice].join(' ')}>
                {MINUS_SYMBOL}
                <Price
                    value={detailOrder.total.student_discount.value || '0'}
                    currencyCode={
                        detailOrder.total.student_discount.currency || 'IDR'
                    }
                />
            </p>
        </div>
    )

    return (
        <>
            <BreadcrumbNavigation orderId={detailOrder.order_number} />
            <div className={classes.orderDetailHeader}>
                {['pending', 'pending_payment'].includes(detailOrder.status) ? (
                    <PaymentCountdown
                        classes={classes}
                        banner
                        order={detailOrder}
                    />
                ) : null}
                <div className={classes.orderDetailTopRow}>
                    <div className={classes.orderDetailMeta}>
                        <h3
                            className={`${classes.orderDetailStatus} ${classes.orderStatusColor}`}
                            data-order-status={detailOrder.status}
                            style={detailOrder.dfi_display_status?.color ? { color: detailOrder.dfi_display_status.color } : undefined}
                        >
                            {detailOrder.dfi_display_status?.label || detailOrder.status_label}
                        </h3>
                        <h3 className={classes.orderDetailNumber}>
                            #{detailOrder.order_number}
                        </h3>
                        <p className={classes.orderDetailDate}>
                            {formatDate(detailOrder.created_at)}
                        </p>
                    </div>
                    <Button
                        onClick={handleDownloadInvoice}
                        className={classes.downloadButton}
                        disabled={invoiceLoading || !isOrderCompleted}
                    >
                        {invoiceLoading ? 'Download...' : 'Download Invoice'}
                    </Button>
                </div>
                <div className={`${classes.shippingInfoWrapper} ${isReturnRefund ? classes.returnShippingInfo : ''}`}>
                    {isReturnRefund ? (
                        <div className={classes.returnSummaryCard}>
                            <div className={classes.returnSummaryHeader}>
                                <span className={classes.returnSummaryTitle}>
                                    {isRefundOnly ? (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                            <path d="M18.3385 5.83333H1.67188V3.33333C1.67188 3.11232 1.75967 2.90036 1.91595 2.74408C2.07223 2.5878 2.28419 2.5 2.50521 2.5H17.5052C17.7262 2.5 17.9382 2.5878 18.0945 2.74408C18.2507 2.90036 18.3385 3.11232 18.3385 3.33333V5.83333ZM18.3385 7.5V16.6667C18.3385 16.8877 18.2507 17.0996 18.0945 17.2559C17.9382 17.4122 17.7262 17.5 17.5052 17.5H2.50521C2.28419 17.5 2.07223 17.4122 1.91595 17.2559C1.75967 17.0996 1.67188 16.8877 1.67188 16.6667V7.5H18.3385ZM9.17188 11.6667V9.58333L5.42188 13.3333H14.1719V11.6667H9.17188Z" fill="black" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M17.3555 17.2751H2.72656V6.13647H17.3555V17.2751ZM8.77734 8.04468C8.77734 7.85037 8.5611 7.73477 8.39941 7.84253L5.41309 9.83276C5.26871 9.92909 5.26866 10.1417 5.41309 10.238L8.39941 12.2283C8.56084 12.3356 8.77672 12.2208 8.77734 12.0271V10.7654H11.5293C12.3075 10.7658 12.9393 11.3972 12.9395 12.1755C12.9391 12.9537 12.3074 13.5852 11.5293 13.5857H7.55469V15.0457H11.5293C13.1136 15.0452 14.3991 13.7599 14.3994 12.1755C14.3993 10.591 13.1137 9.30684 11.5293 9.3064H8.77734V8.04468Z" fill="black"/>
  <path d="M3.51609 16.5221H16.4855V7.22007H3.51609V16.5221ZM5.56895 3.47788L4.23839 5.51767H15.7643L14.4314 3.47788H5.56895ZM18.189 17.2515C18.189 17.7889 17.7534 18.2243 17.2161 18.2245H2.78547C2.24821 18.2242 1.8125 17.7889 1.8125 17.2515V6.11523L4.36075 2.21623C4.54049 1.94121 4.84718 1.77548 5.17572 1.77548L14.8258 1.77429L14.9482 1.78261C15.1891 1.81309 15.4099 1.93261 15.5671 2.11762L15.6408 2.21504L18.189 6.11523V17.2515Z" fill="black"/>
</svg>
                                    )}
                                    {isRefundOnly ? 'Refund Request' : returnRequest?.solution?.label || 'Return Request'}
                                </span>
                                <span className={classes.returnApprovalBadge} data-approval={returnApproval}>
                                    {returnApproval}
                                </span>
                            </div>
                            <div className={classes.returnSummaryBody}>
                                <div className={classes.returnReasonLabel}>
                                    {isRefundOnly ? 'Refund Reason:' : 'Return & Refund Reason:'}
                                </div>
                                <div>{returnRequest?.reason?.label || '-'}</div>
                                {returnRequest?.reason_other_text ? <div>{returnRequest.reason_other_text}</div> : null}
                            </div>
                        </div>
                    ) : null}
                    {isOrderCanceled ? (
                        <div className={classes.shippingContent}>
                            <h3 className={classes.shippingTitle}>Cancel Reason</h3>
                            <div className={classes.shippingText}>
                                {detailOrder.dfi_cancellation?.reason || '-'}
                                {detailOrder.dfi_cancellation?.reason_note ? (
                                    <div>{detailOrder.dfi_cancellation.reason_note}</div>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                    <div className={classes.shippingContent}>
                        <h3 className={classes.shippingTitle}>Payment Method</h3>
                        <div className={classes.shippingText}>
                            {detailOrder.payment_methods?.length ? (
                                <PaymentMethod accountOrderDetail={true} classes={isVaOrPendingPayment ? { root: classes.paymentMethodRootCompact } : {}} data={detailOrder.payment_methods} />
                            ) : '-'}
                        </div>
                        {isVaOrPendingPayment ? (
                            <span className={classes.vaPaymentHint}>
                                <WarningOutlineIcon />
                                <span style={{ lineHeight: '16px' }}>Check your email for the detail VA number</span>
                            </span>
                        ) : null}
                    </div>
                    <div className={classes.shippingContent}>
                        <h3 className={classes.shippingTitle}>Shipped To</h3>
                        <div className={classes.shippingText}>
                            {detailOrder.shipping_address ? (
                                <ShippingInformation accountOrderDetail={true} data={detailOrder.shipping_address} />
                            ) : '-'}
                        </div>
                    </div>
                    <div className={classes.shippingContent}>
                        <h3 className={classes.shippingTitle}>Shipping Method</h3>
                        <div className={classes.shippingText}>
                            {detailOrder.shipping_method ? (
                                <ShippingMethod accountOrderDetail={true} data={shippingMethodData} />
                            ) : '-'}
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes.deliveryDetailsContainer}>
                <div
                    className={classes.deliveryDetailsHeader}
                    onClick={handleDeliveryDetailsClick}
                >
                    <span className={classes.deliveryDetailsTitle}>Delivery details</span>
                    <span className={classes.deliveryDetailsArrow}><RightArrow /></span>
                </div>

                <div className={classes.shippingAddressContainer}>
                    <div className={classes.shippingAddressHeader}>
                        <span className={classes.shippingAddressIcon}>
                            <LocationIcon />
                        </span>
                        <span className={classes.shippingAddressTitle}>Shipping address</span>
                    </div>
                    <div className={classes.shippingAddressContent}>
                        <div className={classes.shippingAddressText}>
                            <div className={classes.addressLine}>{formatAddress(detailOrder.shipping_address)}</div>
                        </div>
                    </div>
                </div>
            </div>
            {orderComments}
            <p className={classes.orderQtyItem}>
                {calculateItems(detailOrder.items)} item ordered
            </p>
            <table className={classes.tableDetailItems}>
                <tbody>
                    {detailOrder.items.map(item =>
                        item.is_gwp ? null : (
                            <tr className={classes.tableRowDetail} key={item.id}>
                                <td className={classes.tableImage}>
                                    <div className={classes.imageWrapper} style={{ position: 'relative' }}>
                                        <Link to={linkUrl(imagesData[item.product_sku]?.url_key)} className={classes.productLink}>
                                            <img
                                                src={imageSrc(item.product_sku)}
                                                alt={item.product_name}
                                            />
                                        {item?.is_flash_sale_item &&
                                            <svg style={{ position: 'absolute', left: 8, top: 4 }} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                <path d="M0 0H32V15.8254C32 24.6619 24.8366 31.8254 16 31.8254V31.8254C7.16344 31.8254 0 24.6619 0 15.8254V0Z" fill="#FF8200" />
                                                <g filter="url(#filter0_d_7560_28968)">
                                                    <path d="M15.7739 20.0037H19.5454L16.8181 23.1838L19.2025 23.1873L16.0347 28.1873L16.4266 24.7766H13.7168L15.7739 20.0037Z" fill="url(#paint0_linear_7560_28968)" />
                                                </g>
                                                <path d="M25.3347 17.3033V18.1604H22.4803V17.3033H25.3347ZM22.8412 12.8271V18.1604H21.7363V12.8271H22.8412ZM24.9627 14.9993V15.8344H22.4803V14.9993H24.9627ZM25.331 12.8271V13.6879H22.4803V12.8271H25.331Z" fill="#F9F9F9" />
                                                <path d="M21.1036 17.3033V18.1604H18.4039V17.3033H21.1036ZM18.7612 12.8271V18.1604H17.6562V12.8271H18.7612Z" fill="#F9F9F9" />
                                                <path d="M14.7701 13.7392L13.3116 18.1604H12.1367L14.1292 12.8271H14.8769L14.7701 13.7392ZM15.9818 18.1604L14.5196 13.7392L14.4018 12.8271H15.1568L17.1604 18.1604H15.9818ZM15.9155 16.1751V17.0359H13.0833V16.1751H15.9155Z" fill="#F9F9F9" />
                                                <path d="M27.0235 6.79248V7.64961H24.2244V6.79248H27.0235ZM24.5522 4.62036V9.9536H23.4473V4.62036H24.5522ZM27.8117 4.62036V9.9536H26.7104V4.62036H27.8117Z" fill="#F9F9F9" />
                                                <path d="M21.5906 8.55779C21.5906 8.46255 21.5759 8.37709 21.5464 8.30139C21.5194 8.22324 21.4679 8.15243 21.3917 8.08894C21.3156 8.023 21.2088 7.95829 21.0713 7.8948C20.9338 7.83131 20.7558 7.76538 20.5373 7.697C20.2942 7.61886 20.0634 7.53095 19.8449 7.43327C19.6288 7.33559 19.4373 7.22204 19.2703 7.09262C19.1058 6.96075 18.9757 6.80813 18.8799 6.63475C18.7866 6.46137 18.74 6.25991 18.74 6.03036C18.74 5.80815 18.7891 5.60668 18.8873 5.42598C18.9855 5.24283 19.123 5.08655 19.2998 4.95712C19.4766 4.82526 19.6853 4.72392 19.9259 4.6531C20.169 4.58228 20.4354 4.54688 20.7251 4.54688C21.1204 4.54688 21.4654 4.61769 21.76 4.75933C22.0547 4.90096 22.283 5.09509 22.4451 5.34173C22.6096 5.58837 22.6919 5.87042 22.6919 6.18787H21.5943C21.5943 6.03159 21.5612 5.89484 21.4949 5.77762C21.431 5.65797 21.3328 5.56395 21.2002 5.49558C21.0701 5.4272 20.9056 5.39301 20.7067 5.39301C20.5152 5.39301 20.3556 5.42232 20.2279 5.48092C20.1002 5.53709 20.0045 5.61401 19.9406 5.71169C19.8768 5.80693 19.8449 5.91437 19.8449 6.03403C19.8449 6.12438 19.867 6.20619 19.9112 6.27944C19.9578 6.3527 20.0266 6.42108 20.1174 6.48457C20.2083 6.54806 20.32 6.60789 20.4526 6.66405C20.5852 6.72022 20.7386 6.77516 20.9129 6.82888C21.2051 6.9168 21.4617 7.01569 21.6827 7.12558C21.9061 7.23547 22.0927 7.35879 22.2425 7.49554C22.3923 7.63229 22.5052 7.78735 22.5814 7.96073C22.6575 8.13411 22.6955 8.33069 22.6955 8.55047C22.6955 8.78245 22.6501 8.99002 22.5593 9.17316C22.4684 9.35631 22.3371 9.51138 22.1652 9.63836C21.9933 9.76534 21.7883 9.8618 21.5501 9.92773C21.3119 9.99366 21.0455 10.0266 20.7509 10.0266C20.4857 10.0266 20.2242 9.99244 19.9664 9.92407C19.7086 9.85325 19.4741 9.74702 19.2629 9.60539C19.0542 9.46376 18.8873 9.28305 18.7621 9.06328C18.6368 8.8435 18.5742 8.58343 18.5742 8.28307H19.6828C19.6828 8.44912 19.7086 8.58954 19.7602 8.70431C19.8117 8.81908 19.8842 8.91188 19.9775 8.98269C20.0732 9.05351 20.1862 9.10479 20.3163 9.13654C20.4489 9.16828 20.5937 9.18415 20.7509 9.18415C20.9424 9.18415 21.0996 9.15729 21.2223 9.10357C21.3475 9.04985 21.4396 8.97537 21.4985 8.88013C21.5599 8.78489 21.5906 8.67745 21.5906 8.55779Z" fill="#F9F9F9" />
                                                <path d="M10.3309 16.7402C10.3309 16.6449 10.3161 16.5595 10.2867 16.4838C10.2597 16.4056 10.2081 16.3348 10.132 16.2713C10.0559 16.2054 9.94905 16.1407 9.81155 16.0772C9.67405 16.0137 9.49604 15.9477 9.27751 15.8794C9.03443 15.8012 8.80363 15.7133 8.5851 15.6156C8.36903 15.518 8.17751 15.4044 8.01055 15.275C7.84604 15.1431 7.7159 14.9905 7.62015 14.8171C7.52684 14.6437 7.48019 14.4423 7.48019 14.2127C7.48019 13.9905 7.5293 13.7891 7.62751 13.6084C7.72573 13.4252 7.86323 13.2689 8.04001 13.1395C8.2168 13.0076 8.4255 12.9063 8.66613 12.8355C8.90921 12.7647 9.17561 12.7292 9.46535 12.7292C9.86066 12.7292 10.2056 12.8001 10.5003 12.9417C10.7949 13.0833 11.0233 13.2775 11.1853 13.5241C11.3498 13.7707 11.4321 14.0528 11.4321 14.3702H10.3345C10.3345 14.214 10.3014 14.0772 10.2351 13.96C10.1713 13.8403 10.073 13.7463 9.94046 13.6779C9.81032 13.6096 9.64581 13.5754 9.44693 13.5754C9.25541 13.5754 9.09581 13.6047 8.96814 13.6633C8.84046 13.7195 8.7447 13.7964 8.68086 13.8941C8.61702 13.9893 8.5851 14.0967 8.5851 14.2164C8.5851 14.3068 8.6072 14.3886 8.65139 14.4618C8.69805 14.5351 8.7668 14.6035 8.85764 14.6669C8.94849 14.7304 9.06021 14.7903 9.1928 14.8464C9.32539 14.9026 9.47885 14.9575 9.65318 15.0113C9.94537 15.0992 10.202 15.1981 10.4229 15.308C10.6464 15.4178 10.833 15.5412 10.9828 15.6779C11.1325 15.8147 11.2455 15.9697 11.3216 16.1431C11.3977 16.3165 11.4358 16.5131 11.4358 16.7328C11.4358 16.9648 11.3903 17.1724 11.2995 17.3555C11.2086 17.5387 11.0773 17.6937 10.9054 17.8207C10.7335 17.9477 10.5285 18.0442 10.2903 18.1101C10.0522 18.176 9.78577 18.209 9.49113 18.209C9.22595 18.209 8.96445 18.1748 8.70664 18.1064C8.44883 18.0356 8.21434 17.9294 8.00318 17.7878C7.79448 17.6461 7.62751 17.4654 7.50229 17.2456C7.37706 17.0259 7.31445 16.7658 7.31445 16.4654H8.42305C8.42305 16.6315 8.44883 16.7719 8.50039 16.8867C8.55195 17.0015 8.62439 17.0942 8.71769 17.1651C8.81345 17.2359 8.92639 17.2872 9.05653 17.3189C9.18912 17.3507 9.33398 17.3665 9.49113 17.3665C9.68264 17.3665 9.83979 17.3397 9.96256 17.2859C10.0878 17.2322 10.1799 17.1577 10.2388 17.0625C10.3002 16.9673 10.3309 16.8598 10.3309 16.7402Z" fill="#F9F9F9" />
                                                <path d="M15.9127 5.53243L14.4542 9.9536H13.2793L15.2718 4.62036H16.0195L15.9127 5.53243ZM17.1244 9.9536L15.6622 5.53243L15.5444 4.62036H16.2994L18.303 9.9536H17.1244ZM17.0581 7.96829V8.82908H14.2258V7.96829H17.0581Z" fill="#F9F9F9" />
                                                <path d="M11.1579 4.62036V9.9536H10.0566V4.62036H11.1579Z" fill="#F9F9F9" />
                                                <path d="M10.0566 9.12269L12.7995 9.12269L12.7995 10.032L10.0566 10.032L10.0566 9.12269Z" fill="#F9F9F9" />
                                                <path d="M6.58929 4.62036V9.9536H5.48438V4.62036H6.58929ZM8.72545 6.89871V7.75584H6.28728V6.89871H8.72545ZM8.98326 4.62036V5.48115H6.28728V4.62036H8.98326Z" fill="#F9F9F9" />
                                                <defs>
                                                    <filter id="filter0_d_7560_28968" x="12.4043" y="20.0037" width="8.45313" height="10.8086" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                                        <feOffset dy="1.3125" />
                                                        <feGaussianBlur stdDeviation="0.65625" />
                                                        <feComposite in2="hardAlpha" operator="out" />
                                                        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.777967 0 0 0 0 0.0412222 0 0 0 0.21 0" />
                                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7560_28968" />
                                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7560_28968" result="shape" />
                                                    </filter>
                                                    <linearGradient id="paint0_linear_7560_28968" x1="16.8515" y1="20.0037" x2="16.8515" y2="29.8241" gradientUnits="userSpaceOnUse">
                                                        <stop stop-color="#FFE885" />
                                                        <stop offset="0.480769" stop-color="#FFD342" />
                                                        <stop offset="1" stop-color="#FFC321" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>}
                                    </Link>
                                </div>
                            </td>
                            <td
                                className={classes.tableName}
                                style={{ verticalAlign: 'top' }}
                            >
                                <Link to={linkUrl(item.product_url_key)} className={classes.productLink}>
                                    {item.product_name}
                                </Link>
                                {customizableOptions(item)}
                                {bundleOptions(item)}
                            </td>
                            <td style={{ verticalAlign: 'top' }}>
                                qty: {item.quantity_ordered}
                            </td>
                            <td
                                style={{
                                    verticalAlign: 'top',
                                    textAlign: 'right',
                                    color: item?.is_flash_sale_item ? '#FF8200' : '#212121'
                                }}
                            >
                                <Price
                                    currencyCode={
                                        item.product_sale_price.currency
                                    }
                                    value={item.product_sale_price.value}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* CartFreeGift Component - 订单页面：一行显示 3 个，宽度自适应 */}
            <div className={classes.cartFreeGiftContainer}>
                <CartFreeGift
                    showNotificationBanner={false}
                    showGiftSectionBorder={false}
                    isCheckoutPage={false}
                    isOrderPage={true}
                    orderId={detailOrder.order_number}
                />
            </div>
            <div>
                <div className={classes.earnPointsText}>Earn points</div>
                <div className={classes.earnPointsWrapper}>
                    <svg style={{ marginRight: 4 }} width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.28125 1.125C4.52344 1.125 2.92969 2.0625 2.03906 3.5625C1.17188 5.08594 1.17188 6.9375 2.03906 8.4375C2.92969 9.96094 4.52344 10.875 6.28125 10.875C8.01562 10.875 9.60938 9.96094 10.5 8.4375C11.3672 6.9375 11.3672 5.08594 10.5 3.5625C9.60938 2.0625 8.01562 1.125 6.28125 1.125ZM6.28125 12C4.125 12 2.15625 10.875 1.07812 9C0 7.14844 0 4.875 1.07812 3C2.15625 1.14844 4.125 0 6.28125 0C8.41406 0 10.3828 1.14844 11.4609 3C12.5391 4.875 12.5391 7.14844 11.4609 9C10.3828 10.875 8.41406 12 6.28125 12ZM5.34375 7.875H5.90625V6.375H5.34375C5.01562 6.375 4.78125 6.14062 4.78125 5.8125C4.78125 5.50781 5.01562 5.25 5.34375 5.25H6.46875C6.77344 5.25 7.03125 5.50781 7.03125 5.8125V7.875H7.21875C7.52344 7.875 7.78125 8.13281 7.78125 8.4375C7.78125 8.76562 7.52344 9 7.21875 9H5.34375C5.01562 9 4.78125 8.76562 4.78125 8.4375C4.78125 8.13281 5.01562 7.875 5.34375 7.875ZM6.28125 4.5C5.85938 4.5 5.53125 4.17188 5.53125 3.75C5.53125 3.35156 5.85938 3 6.28125 3C6.67969 3 7.03125 3.35156 7.03125 3.75C7.03125 4.17188 6.67969 4.5 6.28125 4.5Z" fill="#FF8200" />
                    </svg>
                    Points will be issued to your wallet when your order is in transit.
                </div>
            </div>
            <div
                className={`${classes.priceSummaryWrapper
                    } d-flex justify-content-between align-items-end`}
            >
                <button
                    onClick={closeDetailHandler}
                    className={classes.backButton}
                >
                    BACK TO MY ORDERS
                </button>
                <div style={{ width: '313px' }}>
                    <div
                        className={`${classes.priceSummary
                            } d-flex justify-content-between align-items-center`}
                    >
                        <p>Subtotal</p>
                        <p>
                            <Price
                                currencyCode={
                                    detailOrder.total.subtotal.currency
                                }
                                value={detailOrder.total.subtotal.value}
                            />
                        </p>
                    </div>
                    <div
                        className={`${classes.priceSummary
                            } d-flex justify-content-between align-items-center`}
                    >
                        <p>Delivery Fee</p>
                        <p>
                            <Price
                                currencyCode={
                                    detailOrder.total.total_shipping.currency
                                }
                                value={detailOrder.total.total_shipping.value}
                            />
                        </p>
                    </div>
                    {detailOrder.total?.total_tp_discount?.currency ? <div
                        className={`${classes.priceSummary
                            } d-flex justify-content-between align-items-center`}
                    >
                        <p>Diskon Produk</p>
                        <p className={classes.priceRed}>
                            -
                            <Price
                                currencyCode={
                                    detailOrder.total.total_tp_discount.currency
                                }
                                value={detailOrder.total.total_tp_discount.value}
                            />
                        </p>
                    </div> : null}
                    {promotionsList}
                    {detailOrder.total.student_discount.value ? studentPassTag : null}
                    {/* <div
                        className={`${classes.priceSummary
                            } d-flex justify-content-between align-items-center`}
                    >
                        {discountRowElement}
                    </div> */}
                    {detail ? (
                        <>
                            {detail.map((item, index) => {
                                const {
                                    aw_giftcard,
                                    aw_reward_points,
                                    aw_store_credit,
                                    discount_amount
                                } = item;

                                return (
                                    <div key={index}>
                                        {discount_amount > 0 && (
                                            <div
                                                className={`${classes.priceSummary
                                                    } d-flex justify-content-between align-items-center`}
                                            >
                                                <p>Diskon</p>
                                                <p className={classes.priceRed}>
                                                    -
                                                    <Price
                                                        currencyCode={
                                                            detailOrder.total
                                                                .subtotal
                                                                .currency
                                                        }
                                                        value={
                                                            discount_amount || 0
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                        {aw_giftcard.giftcard_amount && (
                                            <div
                                                className={`${classes.priceSummary
                                                    } d-flex justify-content-between align-items-center`}
                                            >
                                                <p>Gift Card</p>
                                                <p>
                                                    -
                                                    <Price
                                                        currencyCode={
                                                            detailOrder.total
                                                                .subtotal
                                                                .currency
                                                        }
                                                        value={
                                                            aw_giftcard.giftcard_amount ||
                                                            0
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                        {aw_reward_points.reward_points_amount && (
                                            <div
                                                className={`${classes.priceSummary
                                                    } d-flex justify-content-between align-items-center`}
                                            >
                                                <p>Poin Hadiah</p>
                                                <p className={classes.priceRed}>
                                                    <Price
                                                        currencyCode={
                                                            detailOrder.total
                                                                .subtotal
                                                                .currency
                                                        }
                                                        value={
                                                            aw_reward_points.reward_points_amount ||
                                                            0
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                        {aw_store_credit.store_credit_amount && (
                                            <div
                                                className={`${classes.priceSummary
                                                    } d-flex justify-content-between align-items-center`}
                                            >
                                                <p>Kredit Toko</p>
                                                <p className={classes.priceRed}>
                                                    <Price
                                                        currencyCode={
                                                            detailOrder.total
                                                                .subtotal
                                                                .currency
                                                        }
                                                        value={
                                                            aw_store_credit.store_credit_amount ||
                                                            0
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ) : null}
                    {
                        !!detailOrder?.total?.loyalty_points?.loyalty_points_total?.value &&
                        <div
                            className={`${classes.priceSummary} d-flex justify-content-between align-items-center`}
                        >
                            <p>Burn Points</p>
                            <p>
                                <Price
                                    currencyCode={
                                        detailOrder?.total?.loyalty_points?.loyalty_points_total?.currency
                                    }
                                    value={-detailOrder?.total?.loyalty_points?.loyalty_points_total?.value}
                                />
                            </p>
                        </div>
                    }
                    <div
                        className={`${classes.priceTotal
                            } d-flex justify-content-between align-items-center`}
                    >
                        <p>Total</p>
                        <p>
                            <Price
                                currencyCode={
                                    detailOrder.total.grand_total.currency
                                }
                                value={detailOrder.total.grand_total.value}
                            />
                        </p>
                    </div>
                    <div className={classes.orderActionGroup}>
                        {showCancelToast ? <div className={classes.cancelSuccessToast} role="status">
                            <span className={classes.cancelSuccessIcon} aria-hidden="true">✓</span>
                            Order cancelled successfully
                        </div> : null}
                        <Button
                            onClick={() => handleReorder(detailOrder.order_number)}
                            className={classes.reorderButton}
                            loading={reorderLoading}
                        >
                            Reorder
                        </Button>
                        {orderActionState.secondaryAction ? (
                            <Button
                                className={classes.secondaryOrderActionButton}
                                onClick={handleSecondaryOrderAction}
                                disabled={orderActionState.secondaryActionDisabled}
                            >
                                {orderActionState.secondaryActionLabel}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
            <CancelOrderReasonModal
                orderId={detailOrder.id}
                isOpen={isCancelReasonModalOpen}
                onClose={() => setIsCancelReasonModalOpen(false)}
                onConfirm={handleCancelReasonConfirm}
                onError={message => addToast({ type: 'error', message, timeout: 2000 })}
            />
            <ReturnProductModal
                isOpen={isReturnProductModalOpen}
                items={detailOrder.items}
                onClose={() => setIsReturnProductModalOpen(false)}
                onNext={handleReturnProductNext}
                getImageSrc={imageSrc}
            />

        </>
    );
};

export default AccountOrderDetail;
