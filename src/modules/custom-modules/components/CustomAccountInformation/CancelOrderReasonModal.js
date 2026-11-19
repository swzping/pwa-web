import React, { useEffect, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import PropTypes from 'prop-types';
import { toOrderUid } from '../../../swift-pwa-ui/components/OrderReturn/returnRules';
import classes from './cancelOrderReasonModal.module.css';

const GET_CANCELLATION_CONFIG = gql`
    query GetCancellationConfig {
        storeConfig {
            store_code
            order_cancellation_enabled
            order_cancellation_reasons { description }
        }
    }
`;

const CANCEL_ORDER = gql`
    mutation CancelCustomerOrder($input: CancelOrderInput!) {
        cancelOrder(input: $input) {
            order {
                id
                status
                status_label
                available_actions
                payment_countdown
                dfi_cancellation { canceled_by reason reason_note canceled_at }
                dfi_display_status { code label color return_status }
            }
            errorV2 { code message }
        }
    }
`;

const CancelOrderReasonModal = props => {
    const { isOpen, orderId, onClose, onConfirm, onError } = props;
    const [selectedReason, setSelectedReason] = useState('');
    const [error, setError] = useState('');
    const [reasonNote, setReasonNote] = useState('');
    const submitting = useRef(false);
    const [cancelOrder, { loading }] = useMutation(CANCEL_ORDER, {
        refetchQueries: result => result.data?.cancelOrder?.order && !result.data.cancelOrder.errorV2
            ? ['GetCustomerOrders', 'GetCustomerOrder']
            : []
    });

    const { data: configData, loading: configLoading, error: configError } = useQuery(GET_CANCELLATION_CONFIG, {
        skip: !isOpen,
        fetchPolicy: 'network-only'
    });
    const config = configData?.storeConfig;
    const reasons = [...new Set((config?.order_cancellation_reasons || []).map(reason => reason.description).filter(Boolean))];
    const configMessage = configLoading ? 'Loading cancellation reasons…'
        : configError ? configError.message
        : config?.order_cancellation_enabled !== true ? 'Order cancellation is not available.'
        : !reasons.length ? 'No cancellation reasons are available.' : '';
    const needsNote = selectedReason === 'Other' || selectedReason === 'Others';
    const noteValid = !needsNote || (reasonNote.trim().length > 0 && reasonNote.trim().length <= 255);
    const isConfirmDisabled = !noteValid || loading || Boolean(configMessage) || !orderId || !reasons.includes(selectedReason);

    useEffect(() => {
        setSelectedReason('');
        setReasonNote('');
        setError('');
    }, [isOpen, orderId]);

    if (!isOpen) {
        return null;
    }

    const handleConfirm = async () => {
        if (submitting.current || isConfirmDisabled) {
            return;
        }
        const reason = selectedReason;
        submitting.current = true;
        setError('');
        try {
            const { data } = await cancelOrder({ variables: { input: { order_id: toOrderUid(orderId), reason, ...(needsNote ? { reason_note: reasonNote.trim() } : {}) } } });
            const result = data?.cancelOrder;
            if (result?.errorV2 || !result?.order) {
                throw new Error(result?.errorV2?.message || 'Order cancellation failed. Please try again.');
            }
            onConfirm(result.order, reason);
        } catch (err) {
            const message = err.message || 'Order cancellation failed. Please try again.';
            setError(message);
            if (onError) onError(message);
        } finally {
            submitting.current = false;
        }
    };


    return (
        <div className={classes.overlay} role="dialog" aria-modal="true">
            <div className={classes.modal}>
                <div className={classes.header}>
                    <h3 className={classes.title}>Reason for order cancellation</h3>
                    <button
                        type="button"
                        className={classes.closeButton}
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="#1B1A19"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
                <div className={classes.reasonList}>
                    {configMessage ? <p role={configError ? 'alert' : 'status'}>{configMessage}</p> : null}
                    {!configMessage && reasons.map(reason => (
                        <label
                            className={`${classes.reasonItem} ${
                                selectedReason === reason ? classes.reasonItemSelected : ''
                            }`}
                            key={reason}
                        >
                            <input
                                type="radio"
                                disabled={loading}
                                name="cancelReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={() => setSelectedReason(reason)}
                            />
                            <span>{reason}</span>
                        </label>
                    ))}
                    {needsNote && <input
                        className={classes.otherReasonInput}
                        aria-label="Please enter your reason"
                        placeholder="Please enter your reason"
                        value={reasonNote}
                        maxLength={255}
                        required
                        disabled={loading}
                        onChange={event => setReasonNote(event.target.value)}
                    />}
                </div>
                <div className={classes.footer}>
                    {error && !onError ? <p role="alert">{error}</p> : null}
                    <button
                        type="button"
                        className={classes.confirmButton}
                        disabled={isConfirmDisabled}
                        onClick={handleConfirm}
                    >
                        {loading ? 'Submitting…' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

CancelOrderReasonModal.propTypes = {
    isOpen: PropTypes.bool,
    orderId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onConfirm: PropTypes.func.isRequired
};

export default CancelOrderReasonModal;
