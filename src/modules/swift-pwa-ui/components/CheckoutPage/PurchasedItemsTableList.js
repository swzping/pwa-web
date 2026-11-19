import React, { useEffect, useState } from 'react';
import { useLazyQuery, useQuery, gql } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import CartFreeGift from '../FreeGift/CartFreeGift';
import PurchasedItemsTable from './PurchasedItems/PurchasedItemsTable';
import classes from './PurchasedItems.module.css';
import tableClasses from './PurchasedItems/PurchasedItemsTable.module.css';
import { useLocalStorageListener } from '../../../../helpers/hooks';
import { getCartItemsWithFreeGifts } from '../../../../overrides/peregrine/util/getCartItemsWithFreeGifts';

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
                free_gift_data {
                    sku
                    name
                    url_key
                    qty
                    price {
                        currency
                        value
                    }
                    image_url
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
                    configured_variant {
                        uid
                        is_flash_sale
                        special_from_date
                        special_to_date
                    }
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

const isGamificationFreeGiftItem = item =>
    item?.is_gamification_free_gift === true ||
    item?.is_gamification_free_gift === 'true' ||
    item?.is_gamification_free_gift === 1 ||
    item?.is_gamification_free_gift === '1';

const PurchasedItemsTableList = () => {
    const currentSavaIsEnd = useLocalStorageListener('savaIsEnd')
    const [{ cartId }] = useCartContext();
    const [items, setItems] = useState([]);
    const [totalQuantity, setTotalQuantity] = useState(0);
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
        if (item?.is_free_gift || item?.is_gamification_free_gift) {
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

    const freeGiftItems = getCartItemsWithFreeGifts(items);
    const gamificationFreeGiftItems = items.filter(item => {
        return (
            isGamificationFreeGiftItem(item) &&
            !freeGiftItems.some(displayItem => displayItem.id === item.id)
        );
    });
    const displayItems = freeGiftItems.concat(gamificationFreeGiftItems);

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
            {/* <div className={classes.header}>
                {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} ordered
            </div> */}
            <table className={classes.itemsTable}>
                <thead>
                    <tr className={tableClasses.tableHeader}>
                        <th>product</th>
                        <th></th>
                        <th>price</th>
                        <th>quantity</th>
                        <th>subtotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {displayItems.map((item) => {
                        // Map product data to match the table component props from product.js
                        const tableItem = {
                            currency: getCurrency(item),
                            image: {
                                url: getProductImage(item)
                            },
                            name: getProductName(item),
                            optionText: getProductOptionText(item),
                            unitPrice: getUnitPrice(item),
                            urlKey: item.product.url_key,
                            urlSuffix: item.product.url_suffix,
                            stockStatus: item.product.stock_status,
                            stockItem: item.product.stock_item,
                            quantity: item.quantity,
                            is_free_gift: item.is_free_gift,
                            is_gamification_free_gift: item.is_gamification_free_gift,
                            product: item.product,
                            configured_variant: item.configured_variant,
                            customCartDiscount: item.custom_price ? [{
                                promo_id: "special_price",
                                discount_amount: 0
                            }] : [],
                            promo: null,
                            options: [],
                            customizable_options: item.customizable_options || [],
                            bundle_options: item.bundle_options || [],
                            validOffers: item.validOffers
                        };

                        return (
                            <PurchasedItemsTable
                                key={item.id}
                                item={tableItem}
                                displaySubtotalLoaderId={null}
                                displayRemoveLoaderId={null}
                            />
                        );
                    })}
                </tbody>
            </table>

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

export default PurchasedItemsTableList;
