import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useOrderRow } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderRow';
import Price from '@magento/venia-ui/lib/components/Price';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import { useOrderDetail } from '../../../peregrine/talons/OrderDetail/useOrderDetail';
import ReturnDetail from './returnDetail';
import { useReturnRequest } from './useReturnRequest';
import { getReturnQuantity, getRefundTotal, isReturnGift } from './returnRules';
import defaultClasses from './orderReturnPage.module.css';

// 查看模式预览：'pending_approval' 或 'approved'；后续替换为接口审核状态。
const TEST_RETURN_STATUS = 'approved';

const OrderReturnPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { number = '' } = useParams();
    const history = useHistory();
    const location = useLocation();
    const { setNavConfig } = useContext(HeaderContext);
    const searchParams = new URLSearchParams(location.search);
    const pageMode = location.state?.mode || searchParams.get('mode') || 'create';
    const isViewMode = pageMode === 'view';
    const isApproved = TEST_RETURN_STATUS === 'approved';
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingNotice, setTrackingNotice] = useState('');
    const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
    const [solutionDropdownOpen, setSolutionDropdownOpen] = useState(false);
    const selectedItemIds = location.state?.selectedItemIds || [];
    const talonProps = useOrderDetail({ number });
    const { data, loading, errorMessage } = talonProps;
    const order = data?.customer?.orders?.items?.[0];
    const { imagesData } = useOrderRow({ items: order?.items || [] });

    useEffect(() => {
        setNavConfig({
            headerTitle: isViewMode ? 'Return Detail' : 'Return Order',
            useCart: false,
            closeIcon: true,
            borderBottom: true
        });
    }, [isViewMode, setNavConfig]);

    const request = useReturnRequest({ order, selectedItemIds, isViewMode });
    const {
        setSolutionValue, reasonValue, setReasonValue, otherText, setOtherText,
        notes, setNotes, quantities, setQuantities, uploadedMedia, uploading, submitting,
        requestError, submittedReturn, optionsLoading, optionsError, solutions, reasons,
        reason, solution, selectedItems, media, validationMessage, canSubmit,
        handleUploadMedia, handleRemoveMedia, handleSubmit
    } = request;

    if (submittedReturn) return (
        <div className={classes.root}>
            <h1>Return request submitted</h1>
            <p role="status">Request #{submittedReturn.number} — {submittedReturn.display_status}</p>
            <button className={classes.cancelButton} onClick={() => history.push('/my-account-information')}>Back to My Orders</button>
        </div>
    );

    if (loading) {
        return fullPageLoadingIndicator;
    }

    if (errorMessage) {
        return <ErrorView message={errorMessage} />;
    }

    if (!order) {
        return <ErrorView message={'Data tidak di temukan'} />;
    }

    if (isViewMode) return <ReturnDetail order={order} classes={classes} />;
    if (order.return_eligibility?.can_return !== true) {
        return <ErrorView message={order.return_eligibility?.message || 'This order cannot be returned.'} />;
    }
    const totalItems = (order.items || []).reduce((sum, item) => sum + item.quantity_ordered, 0);
    const refundTotal = getRefundTotal(selectedItems.map(item => ({ item, quantity: quantities[item.id] == null ? getReturnQuantity(item) : quantities[item.id] })));
    const payment = order.payment_methods?.[0];
    const refundTo = /bca|mandiri|virtual account|\bva\b/i.test(`${payment?.type || ''} ${payment?.name || ''}`) ? 'Bank account (via refund link)' : payment?.name || 'To be confirmed';
    const reasonLabel = reason?.label || 'Select';
    const solutionLabel = solution?.label || 'Select';

    const imageSrc = product_sku => imagesData?.[product_sku]?.thumbnail?.url;

    const handleCancel = () => {
        history.goBack();
    };

    return (
        <>
            <StoreTitle>Return Order</StoreTitle>
            {isViewMode ? (
                <div className={classes.statusBanner} role="status">
                    <span className={`${classes.statusBannerIcon} ${isApproved ? classes.approvedIcon : ''}`} aria-hidden="true">
                        {isApproved ? '✓' : '!'}
                    </span>
                    {isApproved
                        ? 'Your return request has been approved. Kindly submit your shipment tracking number'
                        : 'Waiting for merchant confirmation, please be patient'}
                </div>
            ) : null}
            <div className={`${classes.root} ${isViewMode ? classes.viewRoot : ''}`}>
                <h1 className={classes.pageTitle}>{isViewMode ? 'Return & Refund Order' : 'Return Order'}</h1>
                <div className={classes.panel}>
                    <section className={classes.orderInfoSection}>
                        <div className={classes.sectionHeader}>
                            <h2 className={classes.sectionTitle}>Order Information</h2>
                            <span className={classes.orderStatus}>{isViewMode ? (isApproved ? 'Return-Processing' : 'Return-Pending Approval') : order.status}</span>
                        </div>
                        <div className={classes.orderMeta}>
                            <span>Order Number: #{order.order_number}</span>
                            <span>Total of {totalItems} items</span>
                        </div>
                        {isViewMode ? <div className={classes.orderMeta}>
                            <span>Item Total</span>
                            <span><Price currencyCode={order.total?.grand_total?.currency || 'IDR'} value={order.total?.grand_total?.value || 0} /></span>
                        </div> : null}
                    </section>

                    {isViewMode ? (
                        <section className={classes.formSection}>
                            <div className={classes.formGrid}>
                                <div className={classes.field}>
                                    <span>Solution</span>
                                    <div className={classes.disabledValue}>Return & Refund</div>
                                </div>
                                <div className={classes.field}>
                                    <span>Reason</span>
                                    <div className={classes.disabledValue}>-</div>
                                </div>
                            </div>
                            <div className={classes.formGrid}>
                                <div className={classes.field}>
                                    <span>Refund To</span>
                                    <div className={classes.disabledValue}>-</div>
                                </div>
                                {isApproved ? <label className={classes.field}>
                                    <span>Tracking Number <span className={classes.requiredMark}>*</span></span>
                                    <input
                                        value={trackingNumber}
                                        onChange={event => {
                                            setTrackingNumber(event.target.value);
                                            setTrackingNotice('');
                                        }}
                                        placeholder="Please enter your shipment tracking number"
                                        required
                                    />
                                </label> : null}
                            </div>
                        </section>
                    ) : <section className={classes.formSection}>
                        <div className={classes.formGrid}>
                            <div className={classes.field}>
                                <span>Reason *</span>
                                <button
                                    type="button"
                                    className={`${classes.selectTrigger} ${
                                        reasonValue ? '' : classes.selectTriggerPlaceholder
                                    }`}
                                    onClick={() => {
                                        if (!isViewMode) {
                                            setReasonDropdownOpen(isOpen => !isOpen);
                                        }
                                    }}
                                    aria-expanded={reasonDropdownOpen}
                                    disabled={submitting || uploading || optionsLoading}
                                >
                                    {reasonLabel}
                                    <span className={classes.chevron} aria-hidden="true">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path
                                                d="M4 6L8 10L12 6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </button>
                                {reasonDropdownOpen ? <div className={classes.optionList}>
                                    {reasons.map(option => <button
                                        key={option.uid}
                                        type="button"
                                        className={classes.optionItem}
                                        onClick={() => { setReasonValue(option.uid); setOtherText(''); setReasonDropdownOpen(false); }}
                                    >{option.label}</button>)}
                                </div> : null}
                            </div>
                            <div className={classes.field}>
                                <span>Solution *</span>
                                <button
                                    type="button"
                                    className={classes.selectTrigger}
                                    onClick={() => {
                                        if (!isViewMode) {
                                            setSolutionDropdownOpen(isOpen => !isOpen);
                                        }
                                    }}
                                    aria-expanded={solutionDropdownOpen}
                                    disabled={submitting || uploading || optionsLoading}
                                >
                                    {solutionLabel}
                                    <span className={classes.chevron} aria-hidden="true">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path
                                                d="M4 6L8 10L12 6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </button>
                                {solutionDropdownOpen ? <div className={classes.optionList}>
                                    {solutions.map(option => <button
                                        key={option.code}
                                        type="button"
                                        className={classes.optionItem}
                                        onClick={() => { setSolutionValue(option.code); setReasonValue(''); setOtherText(''); setSolutionDropdownOpen(false); }}
                                    >{option.label}</button>)}
                                </div> : null}
                            </div>
                        </div>
                        {reason?.requires_text ? <label className={classes.field}>
                            <span>Please describe the reason *</span>
                            <input value={otherText} maxLength={255} disabled={submitting} onChange={event => setOtherText(event.target.value)} />
                        </label> : null}
                        <div className={classes.formGrid}>
                            <label className={classes.field}>
                                <span>Refund To</span>
                                <input value={refundTo} disabled readOnly />
                            </label>
                            <div className={classes.refundColumn}>
                                <div className={classes.field}>
                                    <span>Total Refund</span>
                                    <div className={classes.disabledValue}>{refundTotal ? <Price currencyCode={refundTotal.currency} value={refundTotal.value} /> : 'To be confirmed'}</div>
                                </div>
                            </div>
                        </div>
                    </section>}

                    <div className={classes.notice}>
                        <span className={classes.noticeIcon}>i</span>
                        <span>Return/exchange orders must include the complete purchase invoice</span>
                    </div>

                    <section className={classes.productsSection}>
                        <h2 className={classes.smallTitle}>Returned product</h2>
                        <div className={classes.productGrid}>
                            {selectedItems.map(item => (
                                <div className={classes.productCard} key={item.id}>
                                    <img
                                        className={classes.productImage}
                                        src={imageSrc(item.product_sku)}
                                        alt={item.product_name}
                                    />
                                    <div className={classes.productInfo}>
                                        <div className={classes.productName}>{item.product_name}</div>
                                        <div className={classes.productRow}>
                                            <span>Quantity:</span>
                                            <input type="number" aria-label={`Return quantity for ${item.product_name}`}
                                                min={1} max={getReturnQuantity(item)} step={1}
                                                value={(quantities[item.id] == null ? getReturnQuantity(item) : quantities[item.id])} disabled={submitting || Boolean(item.return_together_key) || isReturnGift(item)}
                                                onChange={event => setQuantities(current => ({ ...current, [item.id]: Number(event.target.value) }))}
                                            />
                                        </div>
                                        <div className={classes.productRow}>
                                            <span>{isViewMode ? 'Refund Price:' : 'Product Value:'}</span>
                                            <strong>
                                                {item.refundable_unit_price?.value != null && item.refundable_unit_price?.currency ? (
                                                    <Price
                                                        currencyCode={item.refundable_unit_price.currency}
                                                        value={item.refundable_unit_price.value * ((quantities[item.id] == null ? getReturnQuantity(item) : quantities[item.id]))}
                                                    />
                                                ) : 'To be confirmed'}
                                            </strong>
                                        </div>
                                        {isViewMode ? <div className={classes.productRow}>
                                            <span>Reason for Return:</span>
                                            <span>-</span>
                                        </div> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={classes.uploadSection}>
                        {media?.enabled ? <>
                        <div>
                            <div className={classes.uploadLabel}>
                                <span>Attachment</span>
                                {media.min_files > 0 || media.video_required ? <span className={classes.requiredMark}>*</span> : null}
                            </div>
                            <div className={classes.uploadRequirements}>
                                <p>{`Video: ${media.video_required ? 'required' : 'optional'}, up to ${(media.max_video_files == null ? media.max_files : media.max_video_files)} files (max ${media.max_video_mb} MB each).`}</p>
                                <p>{`Photos: optional, up to ${(media.max_image_files == null ? media.max_files : media.max_image_files)} files (max ${media.max_image_mb} MB each).`}</p>
                                {media.max_files < ((media.max_video_files == null ? media.max_files : media.max_video_files)) + ((media.max_image_files == null ? media.max_files : media.max_image_files)) ? <p>{`Up to ${media.max_files} files in total.`}</p> : null}
                            </div>
                        </div>
                        <div className={classes.mediaList}>
                            {uploadedMedia.map(media => (
                                <div className={classes.mediaItem} key={media.id}>
                                    {media.type.toLowerCase() === 'video' ? (
                                        <video className={classes.mediaPreview} src={media.url} muted controls />
                                    ) : (
                                        <img className={classes.mediaPreview} src={media.url} alt={media.name} />
                                    )}
                                    {!isViewMode ? <button
                                        type="button"
                                        className={classes.removeMediaButton}
                                        onClick={() => handleRemoveMedia(media.id)}
                                        disabled={uploading || submitting}
                                        aria-label="Remove media"
                                    >
                                        ×
                                    </button> : null}
                                </div>
                            ))}
                            {!isViewMode ? <label className={classes.uploadButton}>
                                <input
                                    type="file"
                                    accept={[...(media.image_extensions || []), ...(media.video_extensions || [])].map(extension => `.${extension}`).join(',')}
                                    disabled={uploading || submitting || uploadedMedia.length >= media.max_files}
                                    multiple
                                    className={classes.uploadInput}
                                    onChange={handleUploadMedia}
                                />
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="m4 20 7-8 4 4 3-3 3 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </label> : null}
                        </div>
                        </> : null}
                        {isViewMode ? <div className={classes.disabledValue}>-</div> : <label className={classes.field}>
                            <span>Notes</span>
                            <input placeholder="Enter Notes" value={notes} disabled={submitting} onChange={event => setNotes(event.target.value)} />
                        </label>}
                    </section>

                    {isViewMode && isApproved ? <div className={classes.footer}>
                        {trackingNotice ? <span className={classes.trackingNotice} role="status">{trackingNotice}</span> : null}
                        <button
                            type="button"
                            className={classes.confirmButton}
                            disabled={!trackingNumber.trim()}
                            onClick={() => setTrackingNotice('Tracking number submission is not available yet.')}
                        >
                            Confirm
                        </button>
                    </div> : null}
                    {optionsLoading ? <p role="status">Loading return options…</p> : null}
                    {uploading ? <p role="status">Uploading evidence…</p> : null}
                    {optionsError || requestError ? <p role="alert">{requestError || optionsError.message}</p> : null}
                    {!optionsLoading && validationMessage ? <p role="status">{validationMessage}</p> : null}
                    {!isViewMode ? <div className={classes.footer}>
                        <button type="button" className={classes.cancelButton} disabled={uploading || submitting} onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="button" className={classes.sendButton} disabled={!canSubmit} onClick={handleSubmit}>
                            {submitting ? 'Submitting…' : 'Send Request'}
                        </button>
                    </div> : null}
                </div>
            </div>
        </>
    );
};

export default OrderReturnPage;
