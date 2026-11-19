import React, { useState } from 'react';
import { arrayOf, number, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';

import { Printer, AlertCircle as AlertCircleIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine/lib/Toasts';
import BillingInformation from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/billingInformation';
import Items from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/items';
import PaymentMethod from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/paymentMethod';
import ShippingInformation from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/shippingInformation';
import ShippingMethod from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/shippingMethod';
import OrderTotal from '@magento/venia-ui/lib/components/OrderHistoryPage/OrderDetails/orderTotal';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Button from '@magento/venia-ui/lib/components/Button';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import CartProvider from '@magento/peregrine/lib/context/cart';
import UserProvider from '@magento/peregrine/lib/context/user';

import defaultClasses from './orderDetails.module.css';
import { detailFormatDate } from '../../../../../modules/peregrine/hooks/detailFormatDate';
import { LocationIcon, RightArrow, WarningOutlineIcon } from '@/assets/icons';
import CartFreeGift from '../../../../../modules/swift-pwa-ui/components/FreeGift/CartFreeGift';
import { GET_INVOICE_URL } from './orderDetails.gql';
import { getOrderActionState, ORDER_ACTION_TYPES } from '../../../../../modules/custom-modules/components/CustomAccountInformation/orderActionState';
import CancelOrderReasonModal from '../../../../../modules/custom-modules/components/CustomAccountInformation/CancelOrderReasonModal';
import ReturnProductModal from '../../../../../modules/custom-modules/components/CustomAccountInformation/ReturnProductModal';

const errorIcon = <Icon src={AlertCircleIcon} attrs={{ width: 18 }} />;

const ConditionalWrapper = props => (props.condition ? props.children : null);
// const ConditionalWrapper = props => (props.condition ? props.children : props.children);

const OrderDetails = props => {
    const { classes: propClasses, imagesData, orderData: originalOrderData, handleReorder, reorderLoading } = props;
    const [cancelledOrder, setCancelledOrder] = useState(null);
    const orderData = cancelledOrder?.id === originalOrderData.id
        ? { ...originalOrderData, ...cancelledOrder }
        : originalOrderData;
    const {
        billing_address,
        items,
        payment_methods,
        shipping_address,
        shipping_method,
        shipments,
        total,
        detail,
        promotions,
        pickup_store_address
    } = orderData;

    const classes = useStyle(defaultClasses, propClasses);
    const history = useHistory();
    const [{ currentUser }] = useUserContext();
    const [, { addToast }] = useToasts();
    const [isCancelReasonModalOpen, setIsCancelReasonModalOpen] = useState(false);
    const [isReturnProductModalOpen, setIsReturnProductModalOpen] = useState(false);

    const [getInvoiceUrl, { loading: invoiceLoading }] = useLazyQuery(GET_INVOICE_URL, {
        fetchPolicy: 'network-only'
    });

    const shippingMethodData = {
        shippingMethod: shipping_method,
        shipments,
        pickupStoreAddress: pickup_store_address
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

    const formatAddress = (addr) => {
        if (!addr) return '';
        const street = addr.street?.join(', ') || '';
        return `${street}, ${addr.city || ''}, ${addr.region || ''} ${addr.postcode || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
    };

    const handleDeliveryDetailsClick = () => {

        const params = {
            email: currentUser?.email || '',
            orderId: orderData.order_number,
            orderStatus: orderData.status_label || ''
        };
        history.push({
            pathname: `/account-information/order/${orderData.order_number}`,
            state: params
        });
    };

    const handleDownloadInvoice = async () => {
        try {
            const result = await getInvoiceUrl({
                variables: { orderIncrementId: orderData.order_number }
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

    const isOrderCompleted = orderData?.status === 'completed';
    const orderActionState = getOrderActionState(orderData);

    const imageSrc = product_sku => {
        if (imagesData[product_sku]) {
            return imagesData[product_sku].thumbnail.url;
        }
    };

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
                pathname: `/order-return/${orderData.order_number}`,
                search: '?mode=view',
                state: {
                    mode: 'view'
                }
            });
        }
    };

    const handleCancelReasonConfirm = order => {
        setCancelledOrder(order);
        setIsCancelReasonModalOpen(false);
        addToast({ type: 'info', message: 'Order cancelled successfully', timeout: 2000 });
    };

    const handleReturnProductNext = selectedItems => {
        setIsReturnProductModalOpen(false);
        history.push({
            pathname: `/order-return/${orderData.order_number}`,
            state: {
                mode: 'create',
                selectedItemIds: selectedItems.map(item => item.id)
            }
        });
    };

    // BCA/Mandiri VA（name/type 含 bca 或 mandiri，不区分大小写）&& 订单状态为待付款 status pending_payment / pending 都能命中
    const paymentMethod = payment_methods?.[0] || {};
    const isVaOrPendingPayment =
        /bca|mandiri/i.test(
            `${paymentMethod.name || ''} ${paymentMethod.type || ''}`
        ) && orderData?.status === 'pending_payment';

    const orderComments = (orderData.comments && orderData.comments.length > 0) ? (
        <div className={classes.commentContainer}>
            <p className={classes.commentTitle}>
                <FormattedMessage
                    id="orderDetails.comments"
                    defaultMessage="About Your Order"
                />
            </p>
            <div>
                {
                    orderData.comments.map((comment, idx) => (
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

    const hasTotals = total.grand_total && total.grand_total.currency;

    return (
        <UserProvider>
            <CartProvider>
                <div className={classes.root}>
                    <div className={classes.orderInformation}>
                        <h3 className={classes.orderStatusInfo}
                            style={orderData.dfi_display_status?.color ? { color: orderData.dfi_display_status.color } : undefined}>
                            {orderData.dfi_display_status?.label || orderData.status_label || orderData.status}
                        </h3>
                        <p className={classes.orderDateInfo}>
                            {formatDate(orderData.created_at)}
                        </p>
                        <div className={classes.shippingInformationContainer}>
                            {
                                shipping_address ? (
                                    <ConditionalWrapper condition={shipping_address}>
                                        <ShippingInformation data={shipping_address} />
                                    </ConditionalWrapper>
                                ) : (
                                    <div className={classes.heading}>
                                        <FormattedMessage
                                            id="orderDetails.shippingInformationTitle"
                                            defaultMessage="Shipped To"
                                        />
                                        <div>
                                            -
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                        <div className={classes.paymentMethodContainer}>
                            {
                                payment_methods && payment_methods.length ? (
                                    <ConditionalWrapper
                                        condition={payment_methods && payment_methods.length}
                                    >
                                        <PaymentMethod
                                            data={payment_methods}
                                            classes={isVaOrPendingPayment ? { root: classes.paymentMethodRootCompact } : {}}
                                        />
                                    </ConditionalWrapper>
                                ) : (
                                    <div className={classes.heading}>
                                        <FormattedMessage
                                            id="orderDetails.paymentMethodLabel"
                                            defaultMessage="Payment Method"
                                        />
                                        <div>
                                            -
                                        </div>
                                    </div>
                                )
                            }
                            {isVaOrPendingPayment ? (
                                <p className={classes.vaPaymentHint}>
                                    <WarningOutlineIcon />
                                    <p style={{lineHeight: '16px'}}>Check your email for the detail VA number</p>
                                </p>
                            ) : null}
                        </div>
                        <div className={classes.shippingMethodContainer}>
                            {
                                shipping_method ? (
                                    <ConditionalWrapper condition={shipping_method}>
                                        <ShippingMethod data={shippingMethodData} />
                                    </ConditionalWrapper>
                                ) : (
                                    <div className={classes.heading}>
                                        <FormattedMessage
                                            id="orderDetails.shippingMethodLabel"
                                            defaultMessage="Shipping Method"
                                        />
                                        <div>
                                            -
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                        <div className={classes.downloadButtonContainer}>
                            <Button
                                onClick={handleDownloadInvoice}
                                className={classes.downloadButton}
                                disabled={invoiceLoading || !isOrderCompleted}
                            >
                                {invoiceLoading ? 'Loading...' : 'Download Invoice'}
                            </Button>
                        </div>
                        {/* <div className={classes.billingInformationContainer}>
                    <ConditionalWrapper condition={billing_address}>
                        <BillingInformation data={billing_address} />
                    </ConditionalWrapper>
                </div> */}
                    </div>
                    <div className={classes.testDiv}>
                        <div>
                            <div
                                className={classes.deliveryDetailsHeader}
                                onClick={handleDeliveryDetailsClick}
                            >
                                <span className={classes.deliveryDetailsTitle}>Delivery details</span>
                                <span className={classes.deliveryDetailsArrow}><RightArrow /></span>
                            </div>

                            <div className={classes.shippingAddressContainer}>
                                <div className={classes.shippingAddressHeader}>

                                    <div>
                                        <span className={classes.shippingAddressIcon}>
                                            <LocationIcon />
                                        </span>
                                        <span className={classes.shippingAddressTitle}>Shipping address</span>
                                        <div className={classes.shippingAddressText}>
                                            <div className={classes.addressLine}>{formatAddress(shipping_address)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {orderComments}
                    <div className={classes.itemsContainer}>
                        <ConditionalWrapper condition={items && items.length}>
                            <Items data={{ imagesData, items }} />
                        </ConditionalWrapper>

                        {/* CartFreeGift Component - 介于商品下面，Subtotal上面 */}
                        <div className={classes.cartFreeGiftContainer}>
                            <CartFreeGift
                                showNotificationBanner={false}
                                showGiftSectionBorder={false}
                                isCheckoutPage={false}
                                isOrderPage={true}
                                orderId={orderData.order_number}
                            />
                        </div>
                    </div>

                    <div className={classes.orderTotalContainer}>
                        <div className={classes.earnPointsContainer}>
                            <p className={classes.earnPointsTitle}>
                                <FormattedMessage
                                    id="orderDetails.earnPointsTitle"
                                    defaultMessage="Earn points"
                                />
                            </p>
                            <div className={classes.earnPointsContent}>
                                <AlertCircleIcon className={classes.earnPointsIcon} size={14} />
                                <p className={classes.earnPointsDescription}>
                                    <FormattedMessage
                                        id="orderDetails.earnPointsDescription"
                                        defaultMessage="Points will be issued to your wallet when your order is in transit."
                                    />
                                </p>
                            </div>
                        </div>
                        <ConditionalWrapper condition={hasTotals}>
                            <OrderTotal detail={detail} data={total} promotions={promotions} />
                        </ConditionalWrapper>
                        {orderData.return_eligibility?.can_return === false && orderData.return_eligibility.message ? (
                            <p role="status">{orderData.return_eligibility.message}</p>
                        ) : null}
                        <div className={classes.orderActionGroup}>
                            <Button
                                onClick={() => handleReorder(orderData.order_number)}
                                className={classes.reorderButton}
                                loading={reorderLoading}
                            >
                                reorder
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
                    <Button
                        className={classes.printButton}
                        onClick={() => {
                            // TODO will be implemented in PWA-978
                            console.log('Printing Receipt');
                        }}
                    >
                        <Icon src={Printer} />
                        <span className={classes.printLabel}>
                            <FormattedMessage
                                id="orderDetails.printLabel"
                                defaultMessage="Print Receipt"
                            />
                        </span>
                    </Button>
                    <CancelOrderReasonModal
                        orderId={orderData.id}
                        isOpen={isCancelReasonModalOpen}
                        onClose={() => setIsCancelReasonModalOpen(false)}
                        onConfirm={handleCancelReasonConfirm}
                    />
                    <ReturnProductModal
                        isOpen={isReturnProductModalOpen}
                        items={orderData.items}
                        onClose={() => setIsReturnProductModalOpen(false)}
                        onNext={handleReturnProductNext}
                        getImageSrc={imageSrc}
                    />
                </div>
            </CartProvider>
        </UserProvider>
    );
};

export default OrderDetails;

OrderDetails.propTypes = {
    classes: shape({
        root: string,
        shippingInformationContainer: string,
        shippingMethodContainer: string,
        billingInformationContainer: string,
        paymentMethodContainer: string,
        itemsContainer: string,
        orderTotalContainer: string,
        earnPointsContainer: string,
        printButton: string,
        printLabel: string
    }),
    imagesData: arrayOf(
        shape({
            id: number,
            sku: string,
            thumbnail: shape({
                url: string
            }),
            url_key: string,
            url_suffix: string
        })
    ),
    orderData: shape({
        billing_address: shape({
            city: string,
            country_code: string,
            firstname: string,
            lastname: string,
            postcode: string,
            region_id: string,
            street: arrayOf(string)
        }),
        items: arrayOf(
            shape({
                id: string,
                product_name: string,
                product_sale_price: shape({
                    currency: string,
                    value: number
                }),
                product_sku: string,
                selected_options: arrayOf(
                    shape({
                        label: string,
                        value: string
                    })
                ),
                quantity_ordered: number
            })
        ),
        payment_methods: arrayOf(
            shape({
                type: string,
                additional_data: arrayOf(
                    shape({
                        name: string,
                        value: string
                    })
                )
            })
        ),
        shipping_address: shape({
            city: string,
            country_code: string,
            firstname: string,
            lastname: string,
            postcode: string,
            region_id: string,
            street: arrayOf(string),
            telephone: string
        }),
        shipping_method: string,
        pickup_store_address: string,
        shipments: arrayOf(
            shape({
                id: string,
                tracking: arrayOf(
                    shape({
                        carrier: string,
                        number: string
                    })
                )
            })
        ),
        total: shape({
            discounts: arrayOf(
                shape({
                    amount: shape({
                        currency: string,
                        value: number
                    })
                })
            ),
            grand_total: shape({
                currency: string,
                value: number
            }),
            subtotal: shape({
                currency: string,
                value: number
            }),
            total_tax: shape({
                currency: string,
                value: number
            }),
            total_shipping: shape({
                currency: string,
                value: number
            }),
            total_tp_discount: shape({
                currency: string,
                value: number
            })
        })
    })
};
