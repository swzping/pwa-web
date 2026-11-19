import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Price from '@magento/venia-ui/lib/components/Price';
import { getReturnQuantity, resolveReturnItems, toggleReturnSelection, isReturnGift } from '../../../swift-pwa-ui/components/OrderReturn/returnRules';
import classes from './returnProductModal.module.css';

const ReturnProductModal = props => {
    const { isOpen, items, onClose, onNext, getImageSrc } = props;
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    useEffect(() => { setSelectedItemIds([]); }, [isOpen, items]);

    if (!isOpen) {
        return null;
    }

    const returnableItems = (items || []).filter(item => getReturnQuantity(item) > 0);
    const selectedItems = resolveReturnItems(returnableItems, selectedItemIds);
    const isNextDisabled = !selectedItems.length;

    const handleToggleItem = itemId => {
        setSelectedItemIds(currentIds => toggleReturnSelection(returnableItems, currentIds, itemId));
    };

    const handleNext = () => {
        if (isNextDisabled) {
            return;
        }

        onNext(selectedItems);
    };

    return (
        <div className={classes.overlay} role="dialog" aria-modal="true">
            <div className={classes.modal}>
                <div className={classes.header}>
                    <h3 className={classes.title}>Returned product</h3>
                    <button
                        type="button"
                        className={classes.closeButton}
                        onClick={onClose}
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
                <div className={classes.notice}>
                    <span className={classes.noticeIcon}>!</span>
                    <span>If you have several products to return, please send all products in one shipment.</span>
                </div>
                <div className={classes.productList}>
                    {!returnableItems.length ? <p role="status">There are no items left to return in this order.</p> : null}
                    {returnableItems.map(item => (
                        <label className={classes.productItem} key={item.id}>
                            <div className={classes.productContent}>
                                <input
                                    type="checkbox"
                                    className={classes.productCheckbox}
                                    checked={selectedItems.some(selected => selected.id === item.id)}
                                    disabled={isReturnGift(item)}
                                    onChange={() => handleToggleItem(item.id)}
                                />
                                <img
                                    className={classes.productImage}
                                    src={getImageSrc(item.product_sku)}
                                    alt={item.product_name}
                                />
                                <div className={classes.productInfo}>
                                    <div className={classes.productName}>{item.product_name}</div>
                                    <div className={classes.productPriceRow}>
                                        <div className={classes.productPrice}>
                                            {item.refundable_unit_price?.value != null && item.refundable_unit_price.currency ? <Price
                                                currencyCode={item.refundable_unit_price.currency}
                                                value={item.refundable_unit_price.value}
                                            /> : 'To be confirmed'}
                                        </div>
                                        <div className={classes.productQuantity}>x{getReturnQuantity(item)}</div>
                                    </div>
                                    <div className={classes.productTotalRow}>
                                        <span className={classes.productTotalLabel}>Item Total</span>
                                        <span className={classes.productTotal}>
                                            {item.refundable_unit_price?.value != null && item.refundable_unit_price.currency ? <Price
                                                currencyCode={item.refundable_unit_price.currency}
                                                value={item.refundable_unit_price.value * getReturnQuantity(item)}
                                            /> : 'To be confirmed'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
                <div className={classes.footer}>
                    <button
                        type="button"
                        className={classes.nextButton}
                        disabled={isNextDisabled}
                        onClick={handleNext}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

ReturnProductModal.propTypes = {
    isOpen: PropTypes.bool,
    items: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    getImageSrc: PropTypes.func.isRequired
};

export default ReturnProductModal;
