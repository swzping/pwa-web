import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import Gallery from '../../../../overrides/venia-ui/components/Gallery/gallery';
import operations from '../../../../overrides/peregrine/talons/Gallery/addToCart.gql';
import classes from './FreeGiftRecommendationPage.module.css';

// GraphQL queries
const GET_FREE_GIFT_RULES = gql`
    query getFreeGiftRules($cartId: String!) {
        freeGiftRules(cart_id: $cartId) {
            rule_id
            notification_message
            is_eligible
            missing_eligible_qty
            missing_eligible_amount
            eligible_products {
                uid
                name
                sku
            }
            detail {
                event_time {
                    from_date
                    to_date
                }
                description
            }
            items {
                uid
                name
                sku
                url_key
                stock_status
                stock_item {
                    salable_qty
                }
                price {
                    regularPrice {
                        amount {
                            value
                            currency
                        }
                    }
                }
                image {
                    url
                }
            }
            __typename
        }
    }
`;

const GET_ELIGIBLE_PRODUCTS_FOR_GWP = gql`
    query getEligibleProductsForGWP($pageSize: Int!, $currentPage: Int!) {
        eligibleProductsForGWP(page_size: $pageSize, current_page: $currentPage) {
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
            current_page
            page_size
            total_count
            __typename
        }
    }
`;

const FreeGiftRecommendationPage = () => {
    const history = useHistory();
    const location = useLocation();
    const [{ cartId, isCartObsolete }] = useCartContext();
    const { setNavConfig } = useContext(HeaderContext);
    
    // 添加到购物车提示状态
    const [showAddToCartToast, setShowAddToCartToast] = useState(false);
    const [addToCartMessage, setAddToCartMessage] = useState('');
    
    // 检查是否从购物车页面进入
    const isFromCart = location.state?.fromCart || 
                       (typeof document !== 'undefined' && document.referrer.includes('/cart'));
    
    let previousBreadcrumbs = [];
    
    if (isFromCart) {
        // 如果是从购物车进入，显示 "Shopping Cart"
        previousBreadcrumbs = [{
            text: 'Shopping Cart',
            path: '/cart'
        }];
    } else {
        // 否则使用传递的面包屑数据
        previousBreadcrumbs = (location.state?.breadcrumbs || [])
            .filter(breadcrumb => breadcrumb.text.toLowerCase() !== 'homepage' && breadcrumb.text.toLowerCase() !== 'home')
            .map(breadcrumb => ({
                ...breadcrumb,
                text: breadcrumb.text.replace(/^\s*\/\s*|\s*\/\s*$/g, '').trim()
            }))
            .filter(breadcrumb => breadcrumb.text);
    }
    
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
    
    const [showAllGifts, setShowAllGifts] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [allProducts, setAllProducts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const SuccessIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7Z" fill="#46A147"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.45 3.40004C10.7814 3.64857 10.8486 4.11867 10.6 4.45004L6.10003 10.45C5.97824 10.6124 5.79584 10.7185 5.59448 10.7441C5.39313 10.7696 5.19 10.7125 5.03151 10.5857L2.53151 8.5857C2.20806 8.32694 2.15562 7.85497 2.41438 7.53152C2.67313 7.20808 3.1451 7.15564 3.46855 7.41439L5.36431 8.931L9.40003 3.55004C9.64856 3.21867 10.1187 3.15152 10.45 3.40004Z" fill="white"/>
        </svg>
    );

    const { data: giftRulesData, loading: giftRulesLoading, refetch: refetchGiftRules } = useQuery(
        GET_FREE_GIFT_RULES,
        {
            variables: { cartId },
            skip: !cartId,
            errorPolicy: 'all',
            fetchPolicy: 'network-only'
        }
    );

    // 判断是否满足条件
    const isEligible = giftRulesData?.freeGiftRules?.[0]?.is_eligible || false;

    // 处理添加到购物车成功的回调
    const handleAddToCartSuccess = useCallback((message) => {
        // 只在Web端显示顶部横幅
        if (window.innerWidth > 768) {
            setAddToCartMessage("Added to cart !");
            setShowAddToCartToast(true);
            
            // 3秒后自动隐藏
            setTimeout(() => {
                setShowAddToCartToast(false);
            }, 3000);
        }
    }, []);

    // Refetch gift rules when cart is updated
    useEffect(() => {
        if (cartId && isCartObsolete) {
            refetchGiftRules();
        }
    }, [cartId, isCartObsolete, refetchGiftRules]);

    useEffect(() => {
        const handleResize = () => {
            setShowAllGifts(false);
            setAllProducts([]);
            setCurrentPage(1);
            setHasMore(true);
            setInitialLoadComplete(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const gifts = giftRulesData?.freeGiftRules?.[0]?.items || [];
    const isMobile = window.innerWidth <= 768;
    const maxGiftsToShow = isMobile ? 2 : 6;
    const displayedGifts = showAllGifts ? gifts : gifts.slice(0, maxGiftsToShow);
    const pageSize = isMobile ? 6 : 10;
    const { loading: productsLoading, fetchMore } = useQuery(
        GET_ELIGIBLE_PRODUCTS_FOR_GWP,
        {
            variables: {
                pageSize: pageSize,
                currentPage: currentPage
            },
            fetchPolicy: 'cache-and-network',
            onCompleted: (data) => {
                if (data?.eligibleProductsForGWP?.items) {
                    const formattedProducts = data.eligibleProductsForGWP.items.map(product => ({
                        ...product,
                        small_image: product.image ? {
                            url: product.image.url
                        } : null,
                        price_range: product.price ? {
                            minimum_price: {
                                final_price: {
                                    value: product.price.regularPrice?.amount?.value || 0,
                                    currency: product.price.regularPrice?.amount?.currency || 'IDR'
                                }
                            },
                            maximum_price: {
                                regular_price: {
                                    value: product.price.regularPrice?.amount?.value || 0,
                                    currency: product.price.regularPrice?.amount?.currency || 'IDR'
                                },
                                discount: {
                                    percent_off: 0
                                }
                            }
                        } : {
                            minimum_price: {
                                final_price: {
                                    value: 0,
                                    currency: 'IDR'
                                }
                            },
                            maximum_price: {
                                regular_price: {
                                    value: 0,
                                    currency: 'IDR'
                                },
                                discount: {
                                    percent_off: 0
                                }
                            }
                        },
                        stock_status: product.stock_status || 'IN_STOCK',
                        type_id: 'simple'
                    }));
                    
                    setAllProducts(prev => [...prev, ...formattedProducts]);
                    setHasMore(data.eligibleProductsForGWP.items.length === pageSize);
                }
            }
        }
    );

    useEffect(() => {
        if (!giftRulesLoading && !productsLoading && !initialLoadComplete) {
            setInitialLoadComplete(true);
        }
    }, [giftRulesLoading, productsLoading, initialLoadComplete]);

    const loadMoreProducts = useCallback(async () => {
        if (loading || !hasMore) return;
        
        setLoading(true);
        try {
            const result = await fetchMore({
                variables: {
                    pageSize: pageSize,
                    currentPage: currentPage + 1
                }
            });
            
            if (result.data?.eligibleProductsForGWP?.items) {
                const formattedProducts = result.data.eligibleProductsForGWP.items.map(product => ({
                    ...product,
                    small_image: product.image ? {
                        url: product.image.url
                    } : null,
                    price_range: product.price ? {
                        minimum_price: {
                            final_price: {
                                value: product.price.regularPrice?.amount?.value || 0,
                                currency: product.price.regularPrice?.amount?.currency || 'IDR'
                            }
                        },
                        maximum_price: {
                            regular_price: {
                                value: product.price.regularPrice?.amount?.value || 0,
                                currency: product.price.regularPrice?.amount?.currency || 'IDR'
                            },
                            discount: {
                                percent_off: 0
                            }
                        }
                    } : {
                        minimum_price: {
                            final_price: {
                                value: 0,
                                currency: 'IDR'
                            }
                        },
                        maximum_price: {
                            regular_price: {
                                value: 0,
                                currency: 'IDR'
                            },
                            discount: {
                                percent_off: 0
                            }
                        }
                    },
                    stock_status: product.stock_status || 'IN_STOCK',
                    type_id: 'simple'
                }));
                
                setAllProducts(prev => [...prev, ...formattedProducts]);
                setHasMore(result.data.eligibleProductsForGWP.items.length === pageSize);
            }
            
            setCurrentPage(prev => prev + 1);
        } catch (error) {
            // Error handling
        } finally {
            setLoading(false);
        }
    }, [fetchMore, currentPage, loading, hasMore, pageSize]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
                loadMoreProducts();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreProducts]);

    const generateNotificationMessage = () => {
        const freeGiftRule = giftRulesData?.freeGiftRules?.[0];
        if (!freeGiftRule) return "";
        
        const missingAmount = freeGiftRule.missing_eligible_amount;
        const missingQty = freeGiftRule.missing_eligible_qty;
        
        if (missingAmount && missingQty) {
            return (
                <>
                    Spend Min <span style={{ color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> and <span style={{ color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> to get free gifts !
                </>
            );
        } else if (missingAmount) {
            return (
                <>
                    Spend Min <span style={{ color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> to get free gifts !
                </>
            );
        } else if (missingQty) {
            return (
                <>
                    Spend Min <span style={{ color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> to get free gifts !
                </>
            );
        }
        
        return "You just get free gift!";
    };

    const renderGiftCard = (gift) => {
        const productUrl = gift.url_key ? `/${gift.url_key}.html` : '#';
        
        return (
            <Link key={gift.uid} to={productUrl} className={classes.giftCard}>
                <div className={classes.giftImageWrapper}>
                    <img 
                        src={gift.image?.url || "https://mcstaging.guardianindonesia.co.id/static/version1760582421/frontend/Pearl/weltpixel_custom/en_US/Magento_Catalog/images/product/placeholder/image.jpg"} 
                        alt={gift.name}
                        className={classes.giftImage}
                    />
                    {(gift.stock_item?.salable_qty || 0) <= 0 && (
                        <div className={classes.outOfStockOverlay}>
                            <span className={classes.outOfStockText}>Out of Stock</span>
                        </div>
                    )}
                </div>
                <div className={classes.giftInfo}>
                    <div className={classes.giftName}>{gift.name}</div>
                    <div className={classes.giftLabel}>Gift</div>
                </div>
            </Link>
        );
    };

    return (
        <div className={classes.pageContainer}>
            {/* 顶部横幅提示 - 仅Web端显示 */}
            {showAddToCartToast && (
                <div className={classes.addedToCartToast}>
                    <div className={classes.toastContent}>
                        <svg className={classes.checkIcon} viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" fill="#4CAF50" stroke="#4CAF50" strokeWidth="2"/>
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={classes.toastMessage}>{addToCartMessage}</span>
                    </div>
                </div>
            )}

            <div className={classes.breadcrumbContainer}>
                <div className={classes.breadcrumb}>
                    {previousBreadcrumbs.length > 0 ? (
                        <>
                            {previousBreadcrumbs.map((breadcrumb, index) => (
                                <React.Fragment key={index}>
                                    {breadcrumb.path ? (
                                        <Link className={classes.breadcrumbLink} to={breadcrumb.path}>
                                            {breadcrumb.text}
                                        </Link>
                                    ) : (
                                        <span className={classes.breadcrumbLink}>{breadcrumb.text}</span>
                                    )}
                                    {index < previousBreadcrumbs.length - 1 && (
                                        <span className={classes.breadcrumbSeparator}>/</span>
                                    )}
                                </React.Fragment>
                            ))}
                            <span className={classes.breadcrumbSeparator}>/</span>
                            <span className={classes.breadcrumbText}>Gift With Purchase</span>
                        </>
                    ) : (
                        <span className={classes.breadcrumbText}>Gift With Purchase</span>
                    )}
                </div>
            </div>

            {!initialLoadComplete ? (
                <div className={classes.globalLoading}>
                    <div className={classes.loadingText}>Loading...</div>
                </div>
            ) : (
                <>
                    <div className={classes.notificationBanner}>
                        <div className={classes.notificationText}>
                            {generateNotificationMessage()}
                        </div>
                    </div>

                    <div className={classes.giftSection}>
                        <div className={classes.giftList}>
                            {gifts.length > 0 ? (
                                displayedGifts.map(renderGiftCard)
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

                    {isEligible && (
                        <div className={classes.successMessage}>
                            <div className={classes.successContent}>
                                <SuccessIcon />
                                <span className={classes.successText}>You did it! Your free gift is ready in your cart!</span>
                            </div>
                        </div>
                    )}

                    <div className={classes.productSection}>
                        <Gallery 
                            items={allProducts}
                            layout="grid"
                            onAddToCartSuccess={handleAddToCartSuccess}
                        />
                        {loading && (
                            <div className={classes.loadingText}>Loading more products...</div>
                        )}

                        {!hasMore && allProducts.length > 0 && (
                            <div className={classes.noMoreText}>No more products to load</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FreeGiftRecommendationPage;
