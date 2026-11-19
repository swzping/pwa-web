import React, { useState, useEffect, useRef, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChevronUp } from 'react-feather';
import { useQuery, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import defaultClasses from './FreeGiftListPage.module.css';

// GraphQL查询定义 - 获取完整的赠品规则数据
const GET_FREE_GIFT_RULES = gql`
    query getFreeGiftRules($cartId: String!) {
        freeGiftRules(cart_id: $cartId) {
            rule_id
            progress_bar
            notification_message
            is_eligible
            missing_eligible_qty
            missing_eligible_amount
            eligible_products {
                id
                uid
                name
                sku
                stock_status
                stock_item {
                    salable_qty
                }
                image {
                    url
                }
                price {
                    regularPrice {
                        amount {
                            value
                            currency
                        }
                    }
                }
            }
            detail {
                event_time {
                    from_date
                    to_date
                }
                description
            }
            items {
                id
                uid
                name
                sku
                stock_status
                stock_item {
                    salable_qty
                }
                image {
                    url
                }
                price {
                    regularPrice {
                        amount {
                            value
                            currency
                        }
                    }
                }
            }
            __typename
        }
    }
`;

// Gift Icon Component
const GiftIcon = ({ className }) => (
    <div className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M13.1045 3.65C12.9545 2.3 11.8295 1.25 10.4045 1.25C9.49991 1.25 8.75059 1.83577 8.08570 2.40201C7.95063 2.51704 7.75399 2.52247 7.61507 2.41212C6.94412 1.87918 6.18037 1.25 5.30449 1.25C3.87949 1.25 2.75449 2.3 2.60449 3.65C1.77949 3.95 1.10449 4.775 1.10449 5.75V6.875C1.10449 7.4 1.40449 7.775 1.85449 7.925V13.25C1.85449 14.075 2.52949 14.75 3.35449 14.75H12.3545C13.1795 14.75 13.8545 14.075 13.8545 13.25V7.925C14.3045 7.775 14.6045 7.325 14.6045 6.875V5.75C14.6045 4.775 13.9295 3.95 13.1045 3.65ZM12.3545 5C12.8045 5 13.1045 5.3 13.1045 5.75V6.125C13.1045 6.33211 12.9366 6.5 12.7295 6.5H8.97949C8.77239 6.5 8.60449 6.33211 8.60449 6.125V5.375C8.60449 5.16789 8.77239 5 8.97949 5H12.3545ZM10.4045 2.75C10.7721 2.75 11.1897 2.9502 11.4121 3.26882C11.4854 3.37376 11.3973 3.5 11.2693 3.5H9.3317C9.19898 3.5 9.11816 3.36928 9.20198 3.26638C9.38126 3.04626 9.74505 2.75 10.4045 2.75ZM5.30449 2.75C5.96344 2.75 6.32732 3.04616 6.50676 3.26627C6.59066 3.36919 6.50985 3.5 6.37707 3.5H4.43963C4.31165 3.5 4.22360 3.37376 4.29684 3.26882C4.51924 2.95020 4.93689 2.75 5.30449 2.75ZM2.60449 5.75C2.60449 5.3 2.90449 5 3.35449 5H6.72949C6.93660 5 7.10449 5.16789 7.10449 5.375V6.125C7.10449 6.33211 6.93660 6.5 6.72949 6.5H2.97949C2.77239 6.5 2.60449 6.33211 2.60449 6.125V5.75ZM12.3545 12.875C12.3545 13.0821 12.1866 13.25 11.9795 13.25H3.72949C3.52239 13.25 3.35449 13.0821 3.35449 12.875V8.375C3.35449 8.16789 3.52239 8 3.72949 8H11.9795C12.1866 8 12.3545 8.16789 12.3545 8.375V12.875Z" fill="#999"/>
        </svg>
    </div>
);

const FreeGiftListPage = () => {
    const classes = useStyle(defaultClasses);
    const { formatMessage } = useIntl();
    const giftListRef = useRef(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const { setNavConfig } = useContext(HeaderContext);

    // Get cart ID and obsolete status from cart context
    const [{ cartId, isCartObsolete }] = useCartContext();

    // 配置移动端顶部导航
    useEffect(() => {
        setNavConfig({
            showMobileNav: true,
            headerTitle: 'Gift With Purchase',
            redirectHome: false,
            closeIcon: false,
            useCart: true,
            borderBottom: true
        });
    }, [setNavConfig]);

    // GraphQL查询获取进度条数据
    const { data: freeGiftData, loading, error, refetch } = useQuery(GET_FREE_GIFT_RULES, {
        variables: { cartId },
        skip: !cartId,
        errorPolicy: 'all',
        fetchPolicy: 'network-only'
    });

    // 监听cartId和购物车状态变化，重新获取数据
    useEffect(() => {
        if (cartId && isCartObsolete) {
            refetch();
        }
    }, [cartId, isCartObsolete, refetch]);

    // 监听滚动事件，控制滚动指示器显示
    useEffect(() => {
        const giftList = giftListRef.current;
        if (!giftList) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = giftList;
            const isScrolledDown = scrollTop > 100; // 滚动超过100px时显示指示器
            setShowScrollIndicator(isScrolledDown);
        };

        giftList.addEventListener('scroll', handleScroll);
        return () => giftList.removeEventListener('scroll', handleScroll);
    }, []);

    // 从GraphQL数据中获取所有数据
    const freeGiftRule = freeGiftData?.freeGiftRules?.[0];
    
    // 处理API数据，如果没有数据则不显示模块
    if (!freeGiftRule && !loading) {
        return (
            <div className={classes.pageContainer}>
                <div className={classes.noDataMessage}>
                    No free gift data available
                </div>
            </div>
        );
    }
    
    const progressPercentage = freeGiftRule?.progress_bar || 0;
    const isEligible = freeGiftRule?.is_eligible || false;
    const missingEligibleAmount = freeGiftRule?.missing_eligible_amount || 0;
    const missingEligibleQty = freeGiftRule?.missing_eligible_qty || 0;
    const eventTime = freeGiftRule?.detail?.event_time 
        ? `${freeGiftRule.detail.event_time.from_date} - ${freeGiftRule.detail.event_time.to_date}`
        : "2024/01/01 00:00:00 - 2024/12/31 23:59:59";
    const detailedRulesDescription = freeGiftRule?.detail?.description || "No rules description available";
    
    // 处理赠品数据
    const gifts = freeGiftRule?.items?.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image?.url || "/venia-static-assets/images/empty_product.png",
        currentPrice: "IDR 0",
        originalPrice: item.price?.regularPrice?.amount 
            ? `IDR ${parseFloat(item.price.regularPrice.amount.value).toLocaleString('id-ID')}`
            : "IDR 0",
        stock: item.stock_item?.salable_qty || 0,
        isGift: true,
        isOutOfStock: item.stock_status === "OUT_OF_STOCK" || (item.stock_item?.salable_qty || 0) <= 0
    })) || [];

    // 生成动态消息的函数 - 与抽屉保持一致
    const generateNotificationMessage = (missingAmount, missingQty) => {
        if (missingAmount && missingQty) {
            // 两种情况都有
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> and <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> more to get free gifts !
                </>
            );
        } else if (missingAmount) {
            // 只有金额
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> more to get free gifts !
                </>
            );
        } else if (missingQty) {
            // 只有数量
            return (
                <>
                    Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> more to get free gifts !
                </>
            );
        }
        return null;
    };

    const renderPurchaseRequirement = () => {
        const dynamicMessage = generateNotificationMessage(missingEligibleAmount, missingEligibleQty);
        
        if (!dynamicMessage) {
            return null;
        }

        return (
            <div className={classes.purchaseRequirementSection}>
                <div className={classes.purchaseRequirementBanner}>
                    <span className={classes.purchaseRequirementText}>
                        {dynamicMessage}
                    </span>
                </div>
            </div>
        );
    };

    const renderGiftCard = (gift) => (
        <div 
            key={gift.id} 
            className={`${classes.giftCard} ${gift.isOutOfStock ? classes.outOfStock : ''}`}
        >
            <div className={classes.giftCardContent}>
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
        </div>
    );

    const handleScrollToTop = () => {
        if (giftListRef.current) {
            giftListRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // 如果正在加载，显示加载状态
    if (loading) {
        return (
            <div className={classes.pageContainer}>
                <div className={classes.loadingMessage}>
                    Loading...
                </div>
            </div>
        );
    }

    // 如果有错误，显示错误状态
    if (error) {
        console.error('FreeGift GraphQL Error:', error);
    }

    return (
        <div className={classes.pageContainer}>
            {renderPurchaseRequirement()}
            
            <div className={classes.giftList} ref={giftListRef}>
                {gifts.map((gift) => renderGiftCard(gift))}
            </div>

            {/* 滚动指示器 */}
            {showScrollIndicator && (
                <div className={classes.scrollIndicator} onClick={handleScrollToTop}>
                    <ChevronUp className={classes.scrollArrow} size={16} />
                </div>
            )}
        </div>
    );
};

export default FreeGiftListPage;
