import React from 'react';
import { Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './FreeGiftDrawer.module.css';

// 箭头图标组件
const BackArrow = ({ className }) => (
    <div className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 33" fill="none">
            <path d="M9.3335 16.5076C9.3335 16.2823 9.38356 16.0571 9.467 15.8491C9.56712 15.6239 9.70062 15.4333 9.8675 15.26L20.0135 4.96783C20.2972 4.65594 20.681 4.5 21.0982 4.5C21.3819 4.5 21.6489 4.56931 21.8825 4.70792C22.1161 4.84654 22.2997 5.05446 22.4499 5.27971C22.6001 5.52229 22.6668 5.79952 22.6668 6.09408C22.6668 6.54458 22.5 6.96042 22.1829 7.27231L13.0548 16.5076L22.1829 25.7428C22.4833 26.0374 22.6668 26.4706 22.6668 26.9037C22.6668 27.1983 22.6001 27.4755 22.4499 27.7181C22.3164 27.9607 22.1161 28.1513 21.8825 28.2899C21.6489 28.4285 21.3652 28.5151 21.0982 28.4978C20.6977 28.4978 20.2972 28.3419 20.0135 28.03L9.8675 17.7551C9.70062 17.5992 9.56712 17.3912 9.467 17.1833C9.38356 16.9754 9.3335 16.7328 9.3335 16.5076Z" fill="black" />
        </svg>
    </div>
);


const FreeGiftDrawer = ({
    isOpen,
    onClose,
    eventTime,
    gifts,
    missingEligibleAmount,
    missingEligibleQty
}) => {
    const classes = useStyle(defaultClasses);

    if (!isOpen) return null;

    // 生成动态消息的函数
    const generateNotificationMessage = (missingAmount, missingQty) => {
        if (missingAmount && missingQty) {
            // 两种情况都有
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> and <span style={{ color: '#FF8200', fontWeight: 'bold' }}>{missingQty} products</span> more to get free gifts !
                </>
            );
        } else if (missingAmount) {
            // 只有金额
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> more to get free gifts !
                </>
            );
        } else if (missingQty) {
            // 只有数量
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold' }}>{missingQty} products</span> more to get free gifts !
                </>
            );
        }
        return null;
    };

    const renderGiftCard = (gift) => {
        const cardContent = (
            <div
                key={gift.id}
                className={`${classes.drawerGiftCard} ${gift.isOutOfStock ? classes.outOfStock : ''}`}
            >
                <div className={classes.giftImageWrapper}>
                    <div className={classes.giftImage}>
                        <img src={gift.image} alt={gift.name} />
                        {gift.isOutOfStock && (
                            <div className={classes.outOfStockOverlay}>
                                <span className={classes.outOfStockLabel}>Out of Stock</span>
                            </div>
                        )}
                    </div>
                    <div className={classes.giftInfo}>
                            <h4 className={classes.giftName}>{gift.name}</h4>
                            <div className={classes.giftPrice}>
                                {gift.isGift && <span className={classes.giftLabel}>Gift</span>}
                            </div>
                        </div>
                </div>

                <div className={classes.giftStockRow}>
                    <span className={`${classes.stockText} ${gift.stock <= 0 ? classes.outOfStockText : ''}`}>
                        Stock: {gift.stock}
                    </span>
                    <span className={`${classes.limitedStock} ${gift.stock <= 0 ? classes.outOfStockText : ''}`}>
                        {gift.stock <= 0 ? '*Sorry, this gift has been fully redeemed' : '*Limited stock available'}
                    </span>
                </div>
                <div className={classes.eventTime}>
                    <span className={classes.eventTimeLabel}>
                        {gift.stock <= 0 ? 'Del' : 'Event time'}: {eventTime}
                    </span>
                </div>
                <div className={classes.eventTimeDivider}></div>
            </div>
        );

        // 如果有 productLink，用 Link 包裹；否则直接返回卡片内容
        if (gift.productLink) {
            return (
                <Link to={gift.productLink} key={gift.id} className={classes.giftCardLink}>
                    {cardContent}
                </Link>
            );
        }

        return cardContent;
    };

    return (
        <div className={classes.drawerOverlay} onClick={onClose}>
            <div className={classes.drawerContent} onClick={(e) => e.stopPropagation()}>
                <div className={classes.drawerHeader}>
                    <button className={classes.backButton} onClick={onClose}>
                        <BackArrow className={classes.backArrow} />
                    </button>
                    <h3>Gift With Purchase</h3>
                </div>

                {generateNotificationMessage(missingEligibleAmount, missingEligibleQty) && (
                    <div className={classes.drawerNotificationMessage}>
                        <span className={classes.notificationText}>
                            {generateNotificationMessage(missingEligibleAmount, missingEligibleQty)}
                        </span>
                    </div>
                )}

                <div className={classes.drawerGiftList}>
                    {gifts.map((gift) => renderGiftCard(gift))}
                </div>
            </div>
        </div>
    );
};

export default FreeGiftDrawer;
