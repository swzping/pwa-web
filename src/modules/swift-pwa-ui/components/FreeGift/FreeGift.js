import React, { useState, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChevronRight, X } from 'react-feather';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay } from 'swiper';
import { useHistory, Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useQuery, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import FreeGiftDrawer from './FreeGiftDrawer';
import defaultClasses from './FreeGift.module.css';
import 'swiper/swiper-bundle.min.css';

SwiperCore.use([Autoplay]);

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

const GiftIcon = ({ className, progress = 0, classes }) => {
    const iconClassName = progress >= 100
        ? `${className} ${classes.giftIconFull}`
        : className;

    return (
        <div className={iconClassName}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.1045 3.65C12.9545 2.3 11.8295 1.25 10.4045 1.25C9.49991 1.25 8.75059 1.83577 8.0857 2.40201C7.95063 2.51704 7.75399 2.52247 7.61507 2.41212C6.94412 1.87918 6.18037 1.25 5.30449 1.25C3.87949 1.25 2.75449 2.3 2.60449 3.65C1.77949 3.95 1.10449 4.775 1.10449 5.75V6.875C1.10449 7.4 1.40449 7.775 1.85449 7.925V13.25C1.85449 14.075 2.52949 14.75 3.35449 14.75H12.3545C13.1795 14.75 13.8545 14.075 13.8545 13.25V7.925C14.3045 7.775 14.6045 7.325 14.6045 6.875V5.75C14.6045 4.775 13.9295 3.95 13.1045 3.65ZM12.3545 5C12.8045 5 13.1045 5.3 13.1045 5.75V6.125C13.1045 6.33211 12.9366 6.5 12.7295 6.5H8.97949C8.77239 6.5 8.60449 6.33211 8.60449 6.125V5.375C8.60449 5.16789 8.77239 5 8.97949 5H12.3545ZM10.4045 2.75C10.7721 2.75 11.1897 2.9502 11.4121 3.26882C11.4854 3.37376 11.3973 3.5 11.2693 3.5H9.3317C9.19898 3.5 9.11816 3.36928 9.20198 3.26638C9.38126 3.04626 9.74505 2.75 10.4045 2.75ZM5.30449 2.75C5.96344 2.75 6.32732 3.04616 6.50676 3.26627C6.59066 3.36919 6.50985 3.5 6.37707 3.5H4.43963C4.31165 3.5 4.2236 3.37376 4.29684 3.26882C4.51924 2.9502 4.93689 2.75 5.30449 2.75ZM2.60449 5.75C2.60449 5.3 2.90449 5 3.35449 5H6.72949C6.9366 5 7.10449 5.16789 7.10449 5.375V6.125C7.10449 6.33211 6.9366 6.5 6.72949 6.5H2.97949C2.77239 6.5 2.60449 6.33211 2.60449 6.125V5.75ZM12.3545 12.875C12.3545 13.0821 12.1866 13.25 11.9795 13.25H3.72949C3.52239 13.25 3.35449 13.0821 3.35449 12.875V8.375C3.35449 8.16789 3.52239 8 3.72949 8H11.9795C12.1866 8 12.3545 8.16789 12.3545 8.375V12.875Z" fill="white" />
            </svg>
        </div>
    );
};

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7Z" fill="#46A147" />
        <path fillRule="evenodd" clipRule="evenodd" d="M10.45 3.40004C10.7814 3.64857 10.8486 4.11867 10.6 4.45004L6.10003 10.45C5.97824 10.6124 5.79584 10.7185 5.59448 10.7441C5.39313 10.7696 5.19 10.7125 5.03151 10.5857L2.53151 8.5857C2.20806 8.32694 2.15562 7.85497 2.41438 7.53152C2.67313 7.20808 3.1451 7.15564 3.46855 7.41439L5.36431 8.931L9.40003 3.55004C9.64856 3.21867 10.1187 3.15152 10.45 3.40004Z" fill="white" />
    </svg>
);

const FreeGift = ({ product }) => {
    const classes = useStyle(defaultClasses);
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAllGifts, setShowAllGifts] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    if (!product || !product.is_gwp) {
        return null;
    }

    const [{ cartId, isCartObsolete }] = useCartContext();

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

    const { data: freeGiftData, loading, error, refetch } = useQuery(GET_FREE_GIFT_RULES, {
        variables: { cartId },
        skip: !cartId,
        errorPolicy: 'all',
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (cartId && isCartObsolete) {
            refetch();
        }
    }, [cartId, isCartObsolete, refetch]);

    useEffect(() => {
        if (isDrawerOpen || isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isDrawerOpen, isModalOpen]);

    const freeGiftRule = freeGiftData?.freeGiftRules?.[0];

    if (!freeGiftRule) {
        return null;
    }

    const progressPercentage = freeGiftRule.progress_bar;
    const isEligible = freeGiftRule.is_eligible;
    const notificationMessage = freeGiftRule.notification_message;
    const missing_eligible_amount = freeGiftRule.missing_eligible_amount;
    const missing_eligible_qty = freeGiftRule.missing_eligible_qty;
    const eventTime = freeGiftRule.detail?.event_time
        ? `${freeGiftRule.detail.event_time.from_date} - ${freeGiftRule.detail.event_time.to_date}`
        : "2024/01/01 00:00:00 - 2024/12/31 23:59:59";
    const detailedRulesDescription = freeGiftRule.detail?.description;

    const gifts = freeGiftRule.items?.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image?.url || "/venia-static-assets/images/empty_product.png",
        currentPrice: "IDR 0",
        originalPrice: item.price?.regularPrice?.amount
            ? `IDR ${parseFloat(item.price.regularPrice.amount.value).toLocaleString('id-ID')}`
            : "IDR 0",
        stock: item.stock_item?.salable_qty || 0,
        isGift: true,
        isOutOfStock: item.stock_status === "OUT_OF_STOCK" || (item.stock_item?.salable_qty || 0) <= 0,
        url_key: item.url_key,
        productLink: item.url_key ? resourceUrl(`/${item.url_key}${productUrlSuffix || ''}`) : null
    })) || [];

    const handleDetailedRulesClick = () => {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            history.push('/freegift/rules', {
                eventTime,
                description: detailedRulesDescription
            });
        } else {
            setIsModalOpen(true);
        }
    };

    const handleViewAllClick = () => {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            history.push('/freegift');
        } else {
            setIsDrawerOpen(true);
        }
    };

    const getBreadcrumbData = () => {
        const breadcrumbs = [];
        
        try {
            const selectors = [
                '[class*="breadcrumbs"]',
                '[class*="Breadcrumb"]',
                'nav[aria-label*="readcrumb"]',
                '.breadcrumb',
                '[data-content-type="breadcrumbs"]'
            ];
            
            let breadcrumbContainer = null;
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                
                if (elements.length > 0) {
                    breadcrumbContainer = elements[0];
                    break;
                }
            }
            
            if (breadcrumbContainer) {
                const childNodes = breadcrumbContainer.childNodes;
                
                childNodes.forEach((node, index) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tagName = node.tagName;
                        
                        if (tagName === 'A') {
                            const text = node.textContent?.trim();
                            const href = node.getAttribute('href');
                            
                            if (text && text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                                breadcrumbs.push({
                                    text: text,
                                    path: href || window.location.pathname
                                });
                            }
                        } else if (tagName === 'SPAN' || tagName === 'DIV') {
                            const text = node.textContent?.trim();
                            
                            if (text && text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                                breadcrumbs.push({
                                    text: text,
                                    path: window.location.pathname
                                });
                            }
                        }
                    }
                });
            }
            
            if (breadcrumbs.length === 0) {
                const homeLinks = Array.from(document.querySelectorAll('a')).filter(link => {
                    const text = link.textContent?.trim().toLowerCase();
                    const href = link.getAttribute('href');
                    return (text === 'homepage' || text === 'home') && (href === '/' || href === '/home');
                });
                
                if (homeLinks.length > 0) {
                    const homeLink = homeLinks[0];
                    
                    const parent = homeLink.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children);
                        
                        siblings.forEach((sibling, index) => {
                            
                            const text = sibling.textContent?.trim();
                            if (text && text.toLowerCase() !== 'homepage' && text.toLowerCase() !== 'home') {
                                const href = sibling.tagName === 'A' ? sibling.getAttribute('href') : null;
                                breadcrumbs.push({
                                    text: text,
                                    path: href || window.location.pathname
                                });
                            }
                        });
                    }
                }
            }
            
            if (breadcrumbs.length === 0) {
                const pathSegments = window.location.pathname
                    .split('/')
                    .filter(segment => segment && segment !== 'html');
                
                if (pathSegments.length > 0) {
                    const lastSegment = pathSegments[pathSegments.length - 1];
                    const formattedText = lastSegment
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    breadcrumbs.push({
                        text: formattedText,
                        path: window.location.pathname
                    });
                }
            }
            
        } catch (error) {
        }
        
        return breadcrumbs;
    };

    const handleRecommendationClick = () => {
        const breadcrumbData = getBreadcrumbData();
        
        history.push('/freegift/recommendation', { 
            breadcrumbs: breadcrumbData 
        });
    };

    const generateNotificationMessage = (missingAmount, missingQty) => {
        const isEligible = !missingAmount && !missingQty;

        if (isEligible) {
            return {
                message: "You just get free gift!",
                showSuccessIcon: true
            };
        } else if (missingAmount && missingQty) {
            return {
                message: (
                    <>
                        Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> and <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> more to get free gifts !
                    </>
                ),
                showSuccessIcon: false
            };
        } else if (missingAmount) {
            return {
                message: (
                    <>
                        Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>IDR {new Intl.NumberFormat('id-ID').format(missingAmount)}</span> more to get free gifts !
                    </>
                ),
                showSuccessIcon: false
            };
        } else if (missingQty) {
            return {
                message: (
                    <>
                        Purchase <span style={{ color: '#FF8200', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{missingQty} products</span> more to get free gifts !
                    </>
                ),
                showSuccessIcon: false
            };
        }
        return null;
    };

    const renderProgressBar = () => {
        const dynamicMessage = generateNotificationMessage(missing_eligible_amount, missing_eligible_qty);

        return (
            <div className={classes.progressSection}>
                <div className={classes.progressBarWrapper}>
                    <div className={classes.progressBar}>
                        <div
                            className={classes.progressFill}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <GiftIcon className={classes.giftIcon} progress={progressPercentage} classes={classes} />
                </div>
                <div className={classes.progressMessage} onClick={handleRecommendationClick}>
                    <span className={classes.progressText}>
                        {dynamicMessage?.showSuccessIcon && <SuccessIcon />}
                        {dynamicMessage?.message || notificationMessage}
                    </span>
                    <button
                        className={classes.recommendationButton}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };


    const renderGiftCard = (gift, isModal = false) => {
        const cardContent = (
            <div
                key={gift.id}
                className={`${classes.giftCard} ${gift.isOutOfStock ? classes.outOfStock : ''}`}
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
                    <span className={`${classes.stockText} ${gift.stock <= 0 ? classes.outOfStockText : ''}`}>
                        Stock: {gift.stock}
                    </span>
                </div>
                <div className={classes.giftInfo}>
                    <h4 className={classes.giftName}>{gift.name}</h4>
                    <div className={classes.giftPrice}>
                        <span className={classes.currentPrice}>{gift.currentPrice}</span>
                        {gift.originalPrice && (
                            <span className={classes.originalPrice}>{gift.originalPrice}</span>
                        )}
                        {gift.isGift && <span className={classes.giftLabel}>Gift</span>}
                    </div>
                    <div className={classes.giftStockRow}>
                        <span className={`${classes.limitedStock} ${gift.stock <= 0 ? classes.outOfStockText : ''}`}>
                            {gift.stock <= 0 ? '*Sorry, this gift has been fully redeemed' : '*Limited stock available'}
                        </span>
                    </div>
                </div>
            </div>
        );

        if (gift.productLink) {
            return (
                <Link to={gift.productLink} key={gift.id} className={classes.giftCardLink}>
                    {cardContent}
                </Link>
            );
        }

        return cardContent;
    };

    const renderGiftCarousel = () => {
        const isMobile = window.innerWidth <= 768;

        if (gifts.length === 1) {
            return (
                <div className={classes.singleGift}>
                    {renderGiftCard(gifts[0])}
                </div>
            );
        }

        if (isMobile) {
            const displayedGifts = gifts
            const hasMoreGifts = gifts.length > 2;

            return (
                <div className={classes.giftCarousel}>
                    <div className={classes.carouselHeader}>
                        {hasMoreGifts && (
                            <span className={classes.viewAllLink} onClick={handleViewAllClick}>
                                View all <ChevronRight size={12} />
                            </span>
                        )}
                    </div>
                    <div className={classes.carouselContainer}>
                        {displayedGifts.map((gift, index) => (
                            <div key={gift.id} className={classes.carouselItem}>
                                {renderGiftCard(gift)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const hasMoreGifts = gifts.length > 2;

        return (
            <div className={classes.giftCarousel}>
                <div className={classes.carouselHeader}>
                    {hasMoreGifts && (
                        <span className={classes.viewAllLink} onClick={handleViewAllClick}>
                            View all <ChevronRight size={12} />
                        </span>
                    )}
                </div>
                <Swiper
                    slidesPerView={2}
                    spaceBetween={16}
                    autoplay={{
                        delay: 2000,
                        disableOnInteraction: false,
                    }}
                    loop={gifts.length > 2}
                    speed={600}
                    className={classes.giftSwiperContainer}
                >
                    {gifts.map((gift) => (
                        <SwiperSlide key={gift.id}>
                            {renderGiftCard(gift)}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        );
    };

    const renderDetailedRulesModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className={classes.modalOverlay} onClick={() => setIsModalOpen(false)}>
                <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={classes.modalHeader}>
                        <h3>Detailed Rules</h3>
                        <button
                            className={classes.closeButton}
                            onClick={() => setIsModalOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className={classes.modalEventTime}>
                        <span className={classes.eventTimeLabel}>Event Time:</span>
                        <span className={classes.eventTimeValue}>{eventTime}</span>
                    </div>

                    <div className={classes.modalRulesDetails}>
                        <h4>Rules Details:</h4>
                        <div className={classes.rulesList}>
                            <div dangerouslySetInnerHTML={{ __html: detailedRulesDescription }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    if (loading) {
        return (
            <div className={classes.freeGiftContainer}>
                <div className={classes.header}>
                    <h3 className={classes.title}>Free Gift</h3>
                    <button
                        className={classes.detailedRulesButton}
                        onClick={handleDetailedRulesClick}
                    >
                        Detailed Rules
                    </button>
                </div>
                <div className={classes.progressSection}>
                    <div className={classes.progressBarWrapper}>
                        <div className={classes.progressBar}>
                            <div className={classes.progressFill} style={{ width: '0%' }} />
                        </div>
                        <GiftIcon className={classes.giftIcon} progress={0} classes={classes} />
                    </div>
                    <div className={classes.progressMessage}>
                        <span className={classes.progressText}>Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.freeGiftContainer}>
            <div className={classes.header}>
                <h3 className={classes.title}>Free Gift</h3>
                <button
                    className={classes.detailedRulesButton}
                    onClick={handleDetailedRulesClick}
                >
                    Detailed Rules
                </button>
            </div>

            {renderProgressBar()}
            {renderGiftCarousel()}
            {renderDetailedRulesModal()}
            <FreeGiftDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                eventTime={eventTime}
                gifts={gifts}
                missingEligibleAmount={missing_eligible_amount}
                missingEligibleQty={missing_eligible_qty}
            />
        </div>
    );
};

export default FreeGift;
