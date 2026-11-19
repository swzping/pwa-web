import React, { useEffect, useState } from 'react';
import { useLazyQuery, useQuery, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Price from '@magento/venia-ui/lib/components/Price';
import CartFreeGift from '../FreeGift/CartFreeGift';
import classes from './PurchasedItems.module.css';
import { useSimpleCountdown } from '../../../../overrides/venia-ui/components/ProductFullDetail/countDown/useCountdown'
import { useLocalStorageListener } from '../../../../helpers/hooks'
import ProductBadges from '../Gallery/productBadges';
import shouldShowCartItemVariant from '../../../../helpers/shouldShowCartItemVariant';

const MINI_CART_QUERY_ITEMS = gql`
    query MiniCartQueryItems($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            total_quantity
            prices {
                grand_total {
                    currency
                    value
                    __typename
                }
            }
            items {
                id
                uid
                validOffers {
                    id
                    rule_code
                    name
                    description
                    image
                    promotion_type
                }
                is_free_gift
                is_gamification_free_gift
                custom_price {
                    row_total {
                        currency
                        value
                    }
                }
                product {
                    uid
                    name
                    offers {
                        id
                        rule_code
                        name
                        description
                        image
                        promotion_type
                    }
                    is_flash_sale
                    special_price
                    special_from_date
                    special_to_date
                    url_key
                    url_suffix
                    small_image {
                        url
                    }
                    ... on ConfigurableProduct {
                        variants {
                            product {
                                uid
                                small_image {
                                    url
                                }
                            }
                        }
                    }
                }
                quantity
                ... on ConfigurableCartItem {
                    configurable_options {
                        id
                        option_label
                        value_id
                        value_label
                    }
                }
            }
        }
    }
`;

const GET_FREE_GIFT_RULES = gql`
    query getFreeGiftRules($cartId: String!) {
        freeGiftRules(cart_id: $cartId) {
            rule_id
            progress_bar
            is_eligible
            items {
                id
                uid
                stock_status
                stock_item {
                    salable_qty
                }
            }
            __typename
        }
    }
`;

const PurchasedItems = () => {
    const currentSavaIsEnd = useLocalStorageListener('savaIsEnd')
    const [{ cartId }] = useCartContext();
    const [items, setItems] = useState([]);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const { hours, minutes, seconds, isFinished } = useSimpleCountdown(items?.[0]?.product?.special_from_date, items?.[0]?.product?.special_to_date);
    const [fetchCartDetails, { data, loading }] = useLazyQuery(MINI_CART_QUERY_ITEMS, {
        fetchPolicy: 'cache-and-network'
    });

    // 查询 Free Gift Rules 来判断是否显示 Gift 组件（根据 progress_bar）
    const { data: giftRulesData } = useQuery(GET_FREE_GIFT_RULES, {
        variables: { cartId },
        skip: !cartId,
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        errorPolicy: 'all'
    });

    useEffect(() => {
        if (cartId) {
            fetchCartDetails({ variables: { cartId } });
        }
        return () => {
            localStorage.setItem('checkoutPageReloaded', '')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartId]);

    useEffect(() => {
        if (data?.cart) {
            setItems(data.cart.items || []);
            setTotalQuantity(data.cart.total_quantity || 0);
        }
    }, [data]);


    const getProductImage = (item) => {
        if (item.product.small_image?.url) {
            return item.product.small_image.url;
        }
        
        if (item.product.variants?.[0]?.product?.small_image?.url) {
            return item.product.variants[0].product.small_image.url;
        }
        
        return '/src/assets/images/empty_product.png';
    };

    const getProductName = (item) => {
        return item.product.name;
    };

    const getProductOptionText = (item) => {
        return (item.configurable_options || [])
            .map(option => option.value_label)
            .filter(Boolean)
            .join(' ');
    };

    const getUnitPrice = (item) => {
        // 如果是免费赠品，价格设为 0
        if (item?.is_free_gift) {
            return 0;
        }
        return item.custom_price?.row_total?.value || 0;
    };

    const getCurrency = (item) => {
        return item.custom_price?.row_total?.currency || 'IDR';
    };

    if (loading) {
        return (
            <div className={classes.container}>
                <div className={classes.loading}>Loading items...</div>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return null;
    }

    // 判断是否显示 Gift 组件的条件
    const shouldShowGiftComponent = () => {
        // 如果没有 gift rules 数据，不显示
        if (!giftRulesData?.freeGiftRules?.[0]) {
            return false;
        }

        const freeGiftRule = giftRulesData.freeGiftRules[0];
        const { progress_bar } = freeGiftRule;
        
        // 如果 progress_bar < 100，说明还没有达到领取条件，不显示
        if (progress_bar < 100) {
            return false;
        }

        // progress_bar >= 100，显示 Gift 组件
        return true;
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} ordered
            </div>
            
            {/* { !localStorage.getItem('checkoutPageReloaded') && currentSavaIsEnd && localStorage.getItem('isExistFlashSale') && <div className={classes.mask}>
                <div className={classes.maskContent}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#212121' }}>Flash sales have ended</span>
                    <p className={classes.maskContentText}>Current flash sales items will return to their original prices！</p>
                    <div className={classes.sureBtn} onClick={() => {
                        location?.reload()
                        localStorage.setItem('checkoutPageReloaded', true)
                    }}>OK</div>
                </div>
            </div>} */}
            <div className={classes.itemsList}>
                {items.map((item, index) => {
                    const unitPrice = getUnitPrice(item);
                    const currency = getCurrency(item);
                    const itemTotal = unitPrice * item.quantity;
                    const productLink = resourceUrl(`/${item.product.url_key}${item.product.url_suffix || ''}`);
                    const optionText = getProductOptionText(item);

                    return (
                        <div key={item.id} className={classes.item}>
                            <div className={classes.itemImage}>
                                { item?.product?.is_flash_sale === 1 && !isFinished && <img style={{ width: 32, position: 'absolute', top: 16, left: 8, margin: 0, borderRadius: 0, zIndex: 1}} src='/venia-static-assets/images/flashProduct.png' /> }
                                <img 
                                    src={getProductImage(item)}
                                    alt={item.product.name}
                                    className={classes.productImage}
                                />
                            </div>
                            {item?.product?.is_flash_sale === 1 && !isFinished && <div className={classes.endsInWrap}>
                                <div className={classes.endsIn}>Ends in {hours}:{minutes}:{seconds}</div>
                            </div>}
                            <div className={classes.itemDetails}>
                                <div className={classes.productName}>
                                    {getProductName(item)}
                                </div>
                                {shouldShowCartItemVariant(item) && optionText ? (
                                    <div className={classes.productOptionText}>
                                        {optionText}
                                    </div>
                                ) : null}
                                
                                <div className={classes.priceRow}>
                                    <div className={classes.unitPrice}>
                                        <Price
                                            currencyCode={currency}
                                            value={unitPrice}
                                        />
                                    </div>
                                    <div className={classes.quantity}>
                                        x{item.quantity}
                                    </div>
                                </div>
                                {/* checkout 页面 */}
                                {!item?.is_free_gift && <ProductBadges badges={item?.is_free_gift ? [{promotion_type: 'Free Gift', name: 'Free Gift'}] : item?.validOffers} productLink={productLink} />}
                                
                                <div className={classes.totalRow}>
                                    <div className={classes.itemTotalLabel}>
                                        Item Total
                                    </div>
                                    <div className={classes.itemTotalPrice} style={{ color: item?.product?.is_flash_sale === 1 ? '#FF8200' : '#212121' }}>
                                        {item?.is_free_gift ? 'Free Gift' : <Price currencyCode={currency} value={itemTotal} />}
                                    </div>
                                </div>
                            </div>
                            
                            {index < items.length - 1 && (
                                <div className={classes.separator}></div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* 只有满足条件时才显示 Gift 组件 */}
            {shouldShowGiftComponent() && (
                <>
                    {/* Divider Line */}
                    <div className={classes.sectionDivider}></div>
                    
                    {/* CartFreeGift Component - 不显示消息提示横幅，不显示边框，一行显示2个 */}
                    <CartFreeGift 
                        showNotificationBanner={false} 
                        showGiftSectionBorder={false} 
                        isCheckoutPage={true} 
                    />
                </>
            )}
        </div>
    );
};

export default PurchasedItems;
