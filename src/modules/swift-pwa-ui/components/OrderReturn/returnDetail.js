import React from 'react';
import Price from '@magento/venia-ui/lib/components/Price';
import { useQuery } from '@apollo/client';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { getLatestOrderReturn, getReturnStatusLabel } from '../../../custom-modules/components/CustomAccountInformation/orderActionState';
import { GET_RETURN_DETAIL } from './orderReturn.gql';

const ReturnDetail = ({ order, classes }) => {
    const latestReturn = getLatestOrderReturn(order);
    const { data, loading, error } = useQuery(GET_RETURN_DETAIL, {
        variables: { uid: latestReturn?.uid },
        skip: !latestReturn?.uid,
        // Attachment URLs expire after 30 minutes; fetch fresh links on every visit.
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true
    });
    if (loading) return fullPageLoadingIndicator;
    if (error && !data?.customer?.return) return <ErrorView message={error.message} />;
    const detail = data?.customer?.return;
    if (!latestReturn || !detail) return <ErrorView message="No return request was found for this order." />;

    const totalQuantity = (detail.items || []).reduce((sum, item) => sum + item.request_quantity, 0);
    const itemTotal = detail.dfi_item_total;
    const title = detail.solution?.code === 'REFUND_ONLY' ? 'Refund Order' : 'Return & Refund Order';
    const status = `${detail.solution?.code === 'REFUND_ONLY' ? 'Refund' : 'Return'} - ${getReturnStatusLabel(detail.display_status)}`;
    return (
        <>
            <StoreTitle>Return Detail</StoreTitle>
            <div className={`${classes.root} ${classes.viewRoot}`}>
                <h1 className={classes.pageTitle}>{title}</h1>
                <div className={classes.panel}>
                    <section className={`${classes.orderInfoSection} ${classes.returnDetailInfo}`}>
                        <div className={classes.sectionHeader}>
                            <h2 className={classes.sectionTitle}>Order Information</h2>
                            <span className={classes.returnDetailStatus}>{status}</span>
                        </div>
                        <div className={classes.orderMeta}>
                            <span>Order Number: #{order.order_number}</span>
                            <span>Total of {totalQuantity} items</span>
                        </div>
                        <div className={classes.orderMeta}>
                            <span>Item Total</span>
                            <span>{itemTotal?.value != null && itemTotal.currency ? <Price currencyCode={itemTotal.currency} value={itemTotal.value} /> : 'To be confirmed'}</span>
                        </div>
                    </section>
                    <section className={classes.formSection}>
                        <div className={classes.formGrid}>
                            <div className={classes.field}>
                                <span>Solution</span>
                                <div className={classes.disabledValue}>{detail.solution?.label || '-'}</div>
                            </div>
                            <div className={classes.field}>
                                <span>Reason</span>
                                <div className={classes.disabledValue}>{detail.reason?.label || '-'}</div>
                            </div>
                        </div>
                        {detail.reason_other_text ? <div className={classes.field}>
                            <span>Reason details</span>
                            <div className={classes.disabledValue}>{detail.reason_other_text}</div>
                        </div> : null}
                    </section>
                    <section className={classes.productsSection}>
                        <h2 className={classes.smallTitle}>Returned product</h2>
                        <div className={classes.productGrid}>
                            {(detail.items || []).map(item => <div className={classes.productCard} key={item.uid}>
                                {item.order_item?.product?.thumbnail?.url ? (
                                    <img className={classes.productImage} src={item.order_item.product.thumbnail.url} alt={item.order_item.product_name} />
                                ) : <div className={classes.productImagePlaceholder} role="img" aria-label="Product image unavailable" />}
                                <div className={classes.productInfo}>
                                    <div className={classes.productName}>{item.order_item?.product_name}</div>
                                    <div className={classes.productRow}><span>Quantity:</span><strong>x{item.request_quantity}</strong></div>
                                    <div className={classes.productRow}><span>Refund Price:</span><strong>
                                        {item.order_item?.refundable_unit_price?.value != null && item.order_item.refundable_unit_price.currency ? <Price
                                            currencyCode={item.order_item.refundable_unit_price.currency}
                                            value={item.order_item.refundable_unit_price.value * item.request_quantity}
                                        /> : 'To be confirmed'}
                                    </strong></div>
                                </div>
                            </div>)}
                        </div>
                    </section>
                    <section className={classes.uploadSection}>
                        <div className={classes.mediaList}>
                            {(detail.attachments || []).map((file, index) => <div className={classes.mediaItem} key={`${file.file_name}-${index}`}>
                                {file.type?.toUpperCase() === 'VIDEO'
                                    ? <video className={classes.mediaPreview} src={file.url} title={file.file_name} controls muted />
                                    : <a href={file.url} target="_blank" rel="noopener noreferrer"><img className={classes.mediaPreview} src={file.url} alt={file.file_name} /></a>}
                            </div>)}
                        </div>
                        {detail.comments?.length ? <div className={classes.readOnlyNotes}>
                            {detail.comments.map((comment, index) => <p key={`${comment.created_at}-${index}`}>{comment.text}</p>)}
                        </div> : null}
                    </section>
                    {/* TODO: Connect tracking submission and additional evidence when implementing the post-approval flow. */}
                </div>
            </div>
        </>
    );
};

export default ReturnDetail;
