import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useHistory, Link } from 'react-router-dom';
import classes from './CartFreeGift.module.css';
import { GET_FREE_GIFTS_FOR_ORDER } from '@magento/peregrine/lib/talons/OrderHistoryPage/orderHistoryPage.gql';

const GET_STORE_CONFIG_DATA = gql`
    query getStoreConfigData {
        storeConfig {
            id
            product_url_suffix
            store_code
        }
    }
`;

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
                url_key
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

const CartFreeGift = ({ showNotificationBanner = true, showGiftSectionBorder = true, isCheckoutPage = false, isOrderPage = false, isMiniCart = false, orderId = null }) => {
    const cartContext = useCartContext();
    const userContext = useUserContext();
    
    const [{ cartId, isCartObsolete } = {}, { updateCartObsolete } = {}] = cartContext || [];
    const [{ isSignedIn } = {}] = userContext || [];
    
    const history = useHistory();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showAllGifts, setShowAllGifts] = useState(false);

    // 如果是在订单页面，不需要依赖 cartContext
    if (isOrderPage && !userContext) {
        return null;
    }

    if (!isOrderPage) {
        if (!cartContext || !userContext) {
            return null;
        }

        if (!isSignedIn) {
            return null;
        }
    }

    const { data: storeConfigData } = useQuery(GET_STORE_CONFIG_DATA, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const productUrlSuffix = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.product_url_suffix;
        }
        return '';
    }, [storeConfigData]);

    // 订单页面的礼物查询
    const { data: orderGiftsData, loading: orderGiftsLoading } = useQuery(
        GET_FREE_GIFTS_FOR_ORDER,
        {
            variables: { orderId },
            skip: !isOrderPage || !orderId,
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            errorPolicy: 'all'
        }
    );

    // 购物车页面的礼物规则查询
    const { data: giftRulesData, loading, error, refetch } = useQuery(
        GET_FREE_GIFT_RULES,
        {
            variables: { cartId },
            skip: isOrderPage || !cartId || !isSignedIn,
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            errorPolicy: 'all'
        }
    );

    // 使用 ref 来追踪是否已经处理过当前的 isCartObsolete 状态
    const hasRefetchedRef = useRef(false);

    useEffect(() => {
        if (!isOrderPage && isCartObsolete && cartId && isSignedIn && refetch && !hasRefetchedRef.current) {
            hasRefetchedRef.current = true;
            refetch();
            if (updateCartObsolete) {
                updateCartObsolete(false);
            }
        } else if (!isCartObsolete) {
            // 当 isCartObsolete 变为 false 时，重置标志以便下次可以再次 refetch
            hasRefetchedRef.current = false;
        }
    }, [isCartObsolete, cartId, isSignedIn, isOrderPage, refetch, updateCartObsolete]);

    // 处理订单页面的礼物数据
    let freeGiftRule = null;
    let items = [];

    if (isOrderPage) {
        if (orderGiftsLoading) {
            return null;
        }

        const orderGifts = orderGiftsData?.freeGiftsForOrder || [];
        if (orderGifts.length === 0) {
            return null;
        }

        // 转换订单礼物数据格式以匹配现有的渲染逻辑
        items = orderGifts.map(gift => ({
            id: gift.id,
            uid: gift.uid,
            name: gift.name,
            sku: gift.sku,
            stock_status: gift.stock_status,
            stock_item: gift.stock_item,
            image: gift.image,
            price: gift.price,
            url_key: null // 订单礼物可能没有 url_key
        }));

        freeGiftRule = {
            items,
            is_eligible: true,
            missing_eligible_qty: null,
            missing_eligible_amount: null,
            progress_bar: 100
        };
    } else {
        // 处理购物车页面的礼物数据
        if (!giftRulesData?.freeGiftRules?.[0]) {
            return null;
        }

        freeGiftRule = giftRulesData.freeGiftRules[0];
        items = freeGiftRule.items || [];
    }

    const { is_eligible, missing_eligible_qty, missing_eligible_amount, progress_bar } = freeGiftRule;

    const generateNotificationMessage = () => {
        if (progress_bar >= 100) {
            return "You just get free gift!";
        }
        
        if (missing_eligible_amount && missing_eligible_qty) {
            return (
                <>
                    <span className={classes.highlightText}>
                        IDR{new Intl.NumberFormat('id-ID').format(missing_eligible_amount)}
                    </span>
                    {' '}and{' '}
                    <span className={classes.highlightText}>{missing_eligible_qty} products</span>
                    {' '}away from free gifts!
                </>
            );
        } else if (missing_eligible_amount) {
            return (
                <>
                    <span className={classes.highlightText}>
                        IDR{new Intl.NumberFormat('id-ID').format(missing_eligible_amount)}
                    </span>
                    {' '}away from free gifts!
                </>
            );
        } else if (missing_eligible_qty) {
            return (
                <>
                    <span className={classes.highlightText}>{missing_eligible_qty} products</span>
                    {' '}away from free gifts!
                </>
            );
        }
        
        return "You just get free gift!";
    };

    const getBreadcrumbData = () => {
        const breadcrumbItems = [];
        
        const allLinks = document.querySelectorAll('a');
        
        const homeLinks = Array.from(allLinks).filter(link => {
            const text = link.textContent.trim();
            return text === 'Homepage' || text === 'Home';
        });
        
        const selectors = [
            '[class*="breadcrumbs"]',
            '[aria-live="polite"]',
            'nav[aria-label="Breadcrumbs"]',
            '.breadcrumbs',
            'nav'
        ];
        
        let breadcrumbContainer = null;
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            
            if (elements.length > 0) {
                for (const element of elements) {
                    const homeLink = Array.from(element.querySelectorAll('a')).find(link => {
                        const text = link.textContent.trim();
                        return text === 'Homepage' || text === 'Home';
                    });
                    
                    if (homeLink) {
                        breadcrumbContainer = element;
                        break;
                    }
                }
                if (breadcrumbContainer) break;
            }
        }
        
        if (breadcrumbContainer) {
            const childNodes = Array.from(breadcrumbContainer.childNodes);
            
            childNodes.forEach((node, index) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
                    const text = node.textContent.trim();
                    const href = node.getAttribute('href');
                    
                    if (text && text !== '' && text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                        breadcrumbItems.push({
                            text: text,
                            path: href || null
                        });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                    const text = node.textContent.trim();
                    
                    if (text !== '/' && text !== '>' && text !== '' && 
                        text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                        const innerLink = node.querySelector('a');
                        if (innerLink) {
                            const linkText = innerLink.textContent.trim();
                            const linkHref = innerLink.getAttribute('href');
                            if (linkText && linkText.toLowerCase() !== 'homepage' && linkText.toLowerCase() !== 'home') {
                                breadcrumbItems.push({
                                    text: linkText,
                                    path: linkHref || null
                                });
                            }
                        } else {
                            breadcrumbItems.push({
                                text: text,
                                path: null
                            });
                        }
                    }
                }
            });
        }
        
        if (breadcrumbItems.length === 0) {
            const allLinks = Array.from(document.querySelectorAll('a'));
            const homeLink = allLinks.find(link => {
                const text = link.textContent.trim();
                return text === 'Homepage' || text === 'Home';
            });
            
            if (homeLink) {
                const parent = homeLink.parentElement;
                const siblings = Array.from(parent.children);
                
                siblings.forEach((sibling, index) => {
                    if (sibling.tagName === 'A' && sibling !== homeLink) {
                        const text = sibling.textContent.trim();
                        if (text && text !== '/' && text !== '>' && 
                            text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                            breadcrumbItems.push({
                                text: text,
                                path: sibling.getAttribute('href')
                            });
                        }
                    } else if (sibling.tagName === 'SPAN') {
                        const text = sibling.textContent.trim();
                        if (text && text !== '/' && text !== '>' && 
                            text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                            breadcrumbItems.push({
                                text: text,
                                path: null
                            });
                        }
                    }
                });
            }
        }
        
        if (breadcrumbItems.length === 0) {
            const pathname = window.location.pathname;
            const pathParts = pathname.split('/').filter(part => part && part !== '');
            
            if (pathParts.length > 0) {
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart.endsWith('.html')) {
                    const productName = lastPart
                        .replace('.html', '')
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    breadcrumbItems.push({
                        text: productName,
                        path: null
                    });
                }
            }
        }
        
        return breadcrumbItems;
    };

    const handleRecommendationClick = () => {
        const breadcrumbData = getBreadcrumbData();
        
        history.push({
            pathname: '/freegift/recommendation',
            state: {
                breadcrumbs: breadcrumbData,
                fromCart: true
            }
        });
    };

    const handleViewAllClick = () => {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            history.push('/freegift');
        } else {
            const breadcrumbData = getBreadcrumbData();
            
            history.push({
                pathname: '/freegift/recommendation',
                state: {
                    breadcrumbs: breadcrumbData,
                    fromCart: true
                }
            });
        }
    };

    const SuccessIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7Z" fill="#46A147" />
            <path fillRule="evenodd" clipRule="evenodd" d="M10.45 3.40004C10.7814 3.64857 10.8486 4.11867 10.6 4.45004L6.10003 10.45C5.97824 10.6124 5.79584 10.7185 5.59448 10.7441C5.39313 10.7696 5.19 10.7125 5.03151 10.5857L2.53151 8.5857C2.20806 8.32694 2.15562 7.85497 2.41438 7.53152C2.67313 7.20808 3.1451 7.15564 3.46855 7.41439L5.36431 8.931L9.40003 3.55004C9.64856 3.21867 10.1187 3.15152 10.45 3.40004Z" fill="white" />
        </svg>
    );

    const gifts = items.map(item => ({
        id: item.id,
        uid: item.uid,
        name: item.name,
        image: item.image,
        stock_item: item.stock_item,
        url_key: item.url_key,
        isOutOfStock: item.stock_status === "OUT_OF_STOCK" || (item.stock_item?.salable_qty || 0) <= 0,
        productLink: item.url_key ? `/${item.url_key}${productUrlSuffix}` : null
    }));

    const isMobile = window.innerWidth <= 768;
    const maxGiftsToShow = isMiniCart ? 2 : (isCheckoutPage ? (isMobile ? 2 : 6) : (isOrderPage ? (isMobile ? 2 : 6) : (isMobile ? 2 : 6)));
    const displayedGifts = showAllGifts ? gifts : gifts.slice(0, maxGiftsToShow);

    const renderGiftCard = (gift, index) => {
        const isLastCard = index === displayedGifts.length - 1;
        const shouldHideMargin = showAllGifts && isLastCard;
        // 只在购物车页面且满足条件时显示勾选图标，且商品有货时才显示
        const showCheckIcon = !isCheckoutPage && !isOrderPage && progress_bar >= 100 && !gift.isOutOfStock;
        
        const cardContent = (
            <div 
                key={gift.uid} 
                className={classes.giftCard}
                style={shouldHideMargin ? { marginBottom: 0 } : {}}
            >
                {showCheckIcon && (
                    <div className={classes.checkIconWrapper}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect width="16" height="16" fill="#46A147"/>
                            <path d="M13.333 4L6 11.333L2.667 8" stroke="#FAFAFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                )}
                <div className={classes.giftImageWrapper}>
                    <img 
                        className={classes.giftImage}
                        src={gift.image?.url || "/venia-static-assets/images/empty_product.png"} 
                        alt={gift.name}
                    />
                    {gift.isOutOfStock && (
                        <div className={classes.outOfStockOverlay}>
                            <span className={classes.outOfStockText}>Out of Stock</span>
                        </div>
                    )}
                </div>
                <div className={classes.giftInfo}>
                    <div className={classes.giftName}>{gift.name}</div>
                    <div className={classes.giftLabel}>Gift</div>
                </div>
            </div>
        );

        if (gift.productLink) {
            return (
                <Link to={gift.productLink} key={gift.uid} className={classes.giftCardLink}>
                    {cardContent}
                </Link>
            );
        }

        return cardContent;
    };

    return (
        <>
            {showNotificationBanner && (
                <>
                    <div 
                        className={`${classes.notificationBannerContainer} ${progress_bar >= 100 ? classes.notificationBannerContainerCompleted : ''}`}
                        onClick={progress_bar < 100 ? handleRecommendationClick : undefined}
                        style={{ cursor: progress_bar >= 100 ? 'default' : 'pointer' }}
                    >
                        <div className={classes.notificationBannerImage}>
                            <img 
                                src={progress_bar >= 100 ? "/venia-static-assets/icons/getfree.png" : "/venia-static-assets/icons/miss.png"}
                                alt={progress_bar >= 100 ? "You get free gift!" : "Don't miss the offer!"}
                                className={classes.missImage}
                            />
                        </div>
                        {progress_bar < 100 && (
                            <div className={classes.notificationContent}>
                                <div className={classes.notificationText}>
                                    {generateNotificationMessage()}
                                </div>
                               
                                <div className={classes.arrowIcon}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4L10 8L6 12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            </div>
                        )}
                   
                    </div>
                    {progress_bar < 100 && (
                        <div className={classes.limitedStockText}>*Limited stock available</div>
                    )}
                </>
            )}
            <div 
                className={classes.giftSection}
                style={!showGiftSectionBorder ? { borderBottom: 'none' } : {}}
            >
                {(isCheckoutPage || isOrderPage) && (
                    <div className={classes.giftHeader}>
                        {gifts.length} item{gifts.length !== 1 ? 's' : ''} gift
                    </div>
                )}
                <div className={`${classes.giftList} ${isMiniCart ? classes.giftListMiniCart : ''} ${isCheckoutPage ? classes.giftListCheckout : ''} ${isOrderPage ? (isMobile ? classes.giftListOrderMobile : classes.giftListOrder) : ''}`}>
                    {gifts.length > 0 ? (
                        displayedGifts.map((gift, index) => renderGiftCard(gift, index))
                    ) : (
                        <div>No gifts available</div>
                    )}
                </div>

                {gifts.length > maxGiftsToShow && (
                    <button 
                        className={classes.showMoreButton}
                        onClick={() => setShowAllGifts(!showAllGifts)}
                    >
                        {showAllGifts ? 'Show less' : 'Show more'}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path 
                                d={showAllGifts ? "M4 10L8 6L12 10" : "M4 6L8 10L12 6"} 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </>
    );
};

export default CartFreeGift;