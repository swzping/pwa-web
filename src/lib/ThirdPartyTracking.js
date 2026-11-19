import TagManager from 'react-gtm-module';
import {
    addTocartFbPixel,
    addToWishlistFbPixel,
    purchaseFbPixel
} from '../helpers/fbpixel';

const _sortCategories = categories => {
    if (!categories) return [];

    return categories.slice().sort(function(a, b) {
        if (a.level < b.level) return -1;
        if (a.level > b.level) return 1;

        return 0;
    });
};

export const registerSuccessTracking = params => {
    if (!process.env.ENABLE_TRACKING_GTM) return;

    const tagManagerArgs = {
        dataLayer: {
            event: 'register_success', // custom event name for GTM trigger
            sign_up_method: params.sign_up_method || '', // 'email' | 'phone'
            loyalty_id: params.loyalty_id || '', // hashed/internal ID, never PII like email/phone directly
            user_status: params.user_status || '', // 'new' | 'existing' (guard against double tracking)
            registration_source: params.registration_source || 'web', // 'web' | 'mobile_web' | 'app'
            registration_page: params.registration_page || '/', // page path where form was submitted
            timestamp: new Date().toISOString(),
        },
    };

    TagManager.dataLayer(tagManagerArgs);
};

export const addToCartTracking = (item, quantity, relativeCategory = "") => {
    if (process.env.ENABLE_TRACKING_GTM) {
        let categoryList = '';
        let categoryName = '';

        if (relativeCategory) {
            categoryList = relativeCategory;
            categoryName = relativeCategory.split(' > ').pop();
        } else {
            const categories = _sortCategories(item.categories);
            const breadcrumbsNames = [];
            categories.forEach(({name}) => breadcrumbsNames.push(name));

            categoryList = breadcrumbsNames.join(" > ");
            categoryName = breadcrumbsNames.length > 0
                ? breadcrumbsNames.pop()
                : '';
        }


        let currencyCode = 'IDR';
        let price = 0;

        if (item.price && item.regularPrice && item.regularPrice.amount) {
            currencyCode = item.regularPrice.amount.currency;
            value = item.regularPrice.amount.value;
        }

        const tagManagerArgs = {
            dataLayer: {
                event: 'addToCart',
                eventLabel: 'addToCart',
                ecommerce: {
                    currencyCode,
                    add: {
                        products: [
                            {
                                id: item.sku,
                                name: item.name,
                                price,
                                category: categoryName,
                                list: categoryList,
                                quantity
                                // dimensions4: stock_status,
                            }
                        ]
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 ={
            dataLayer: {
                event: 'add_to_cart',
                ecommerce: {
                    action: {
                        items: [
                            {
                                item_name: item.name,
                                item_id: item.sku,
                                price: item.price_range.maximum_price.regular_price.value,
                                item_category: categoryName,
                                item_list_name: categoryList,
                                quantity,
                                currency: item.price_range.maximum_price.regular_price.currency || 'USD',
                                item_stock_status: item.stock_status,
                                item_sale_product: item.sale === null ? 'NO' : 'YES',
                            },
                        ],
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production') {
            console.log(tagManagerArgsGA4);
        }

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }

    if (
        process.env.FACEBOOK_PIXEL_ENABLE === 'true' &&
        process.env.FACEBOOK_PIXEL_ID
    ) {
        const name = item.name;
        const price = item.special_price
            ? item.special_price
            : item.price?.regularPrice?.amount?.value;
        const currency = item.price?.regularPrice?.amount?.currency;
        const sku = item.sku;
        const qty = quantity;

        addTocartFbPixel(name, price, currency, sku, qty);
    }
};
export const addToWishlistTracking = (item, quantity, relativeCategory = "") => {
    if (process.env.ENABLE_TRACKING_GTM) {
        let categoryList = '';
        let categoryName = '';

        if (relativeCategory) {
            categoryList = relativeCategory;
            categoryName = relativeCategory.split(' > ').pop();
        } else {
            const categories = _sortCategories(item.categories);
            const breadcrumbsNames = [];
            categories.forEach(({name}) => breadcrumbsNames.push(name));

            categoryList = breadcrumbsNames.join(" > ");
            categoryName = breadcrumbsNames.length > 0
                ? breadcrumbsNames.pop()
                : '';
        }

        const tagManagerArgs = {
            dataLayer: {
                event: 'addToWishlist',
                eventLabel: 'addToWishlist',
                ecommerce: {
                    currencyCode:
                        item.price_range.minimum_price.regular_price.currency || 'USD',
                    add: {
                        products: [
                            {
                                id: item.sku,
                                name: item.name,
                                price:
                                item.price_range.minimum_price.regular_price.value,
                                category: categoryName,
                                list: categoryList,
                                quantity
                                // dimensions4: stock_status,
                            }
                        ]
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 ={
            dataLayer: {
                event: 'add_to_wishlist',
                ecommerce: {
                    action: {
                        items: [
                            {
                                currency: item.price_range.minimum_price.regular_price.currency || 'USD',
                                item_name: item.name,
                                item_id: item.sku,
                                price: item.price_range.minimum_price.regular_price.value,
                                item_category: categoryName,
                                item_stock_status: item.stock_status,
                            },
                        ],
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production') {
            console.log(tagManagerArgsGA4);
        }

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }

    if (
        process.env.FACEBOOK_PIXEL_ENABLE === 'true' &&
        process.env.FACEBOOK_PIXEL_ID
    ) {
        const categories = _sortCategories(item.categories);
        const category = categories.length > 0 ? categories.pop().name : '';
        const name = item.name;
        const price = item.price.regularPrice.amount.value || 0;
        const currency = item.price.regularPrice.amount.currency || 'IDR';
        const sku = item.sku;
        const qty = quantity;

        addToWishlistFbPixel(name, price, currency, sku, category, qty);
    }
};
export const checkoutTracking = (
    items,
    currency = 'IDR',
    actionField = { step: 1, option: '' }
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                pageType: 'checkout',
                pageName: 'checkout',
                event: 'checkout',
                eventAction: 'checkout',
                eventLabel: `checkout step ${actionField.step}`,
                ecommerce: {
                    currencyCode: currency,
                    checkout: {
                        actionField,
                        products: items.map((item, index) => {
                            const categories = _sortCategories(item.product.categories);
                            const breadcrumbsNames = [];
                            categories.forEach(({name}) => breadcrumbsNames.push(name));

                            const categoryList = breadcrumbsNames.join(" > ");
                            const categoryName =
                                breadcrumbsNames.length > 0
                                    ? breadcrumbsNames.pop()
                                    : '';

                            return {
                                name: item.product.name,
                                id: item.product.sku,
                                category: categoryName,
                                price: item.prices?.price?.value,
                                list: categoryList,
                                quantity: item.quantity,
                                dimensions4: item.product.stock_status
                            };
                        })
                    }
                }
            }
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgs);

        TagManager.dataLayer(tagManagerArgs);
    }
};
export const checkoutOptionTracking = (
    currency = 'IDR',
    actionField = { step: 1, option: '', action: 'checkout_option' }
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                pageType: 'checkout',
                pageName: 'checkout',
                event: 'checkoutOption',
                eventAction: 'checkoutOption',
                eventLabel: `checkout option step ${actionField.step}`,
                ecommerce: {
                    currencyCode: currency,
                    checkoutOption: {
                        actionField
                    }
                }
            }
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgs);

        TagManager.dataLayer(tagManagerArgs);
    }
};
export const checkoutBeginTracking = ( cart ) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                pageName: 'Checkout',
                pageType: 'checkout',
                event: 'begin_checkout',
                ecommerce: {
                    items: [
                        cart.items.map((item) => ({
                            currency: item.prices.price.currency || 'USD',
                            item_name: item.product.name,
                            item_id: item.product.sku,
                            price: item.prices?.price?.value || 0,
                            item_category: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            item_list_name: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            quantity: item.quantity,
                            item_stock_status: item.product.stock_status,
                        })),
                    ],
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        // Clear the previous ecommerce object.
        TagManager.dataLayer({ dataLayer: { ecommerce: null } });
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const checkoutShippingTracking = (
    items,
    currency = 'IDR',
    actionField
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        // GA 4 dataLayer
        const dataLayerOpt = {
            dataLayer: {
                event: 'add_shipping_info',
                ecommerce: {
                    shipping_tier: actionField.option,
                    items: [
                        items.map((item) => ({
                            currency,
                            item_name: item.product.name,
                            item_id: item.product.sku,
                            price: JSON.stringify(item.prices?.price?.value),
                            item_category: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            item_list_name: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            quantity: JSON.stringify(item.quantity),
                            item_stock_status: item.product.stock_status === 'IN_STOCK' ? 'In stock' : 'Out stock',
                            item_sale_product: '',
                            item_reviews_count: '',
                            item_reviews_score: '',
                        })),

                    ],
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(dataLayerOpt);

        TagManager.dataLayer(dataLayerOpt);
    }
};
export const checkoutPaymentTracking = (
    items,
    currency = 'IDR',
    actionField
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        // GA 4 dataLayer
        const dataLayerOpt = {
            dataLayer: {
                event: 'add_payment_info',
                ecommerce: {
                    payment_type: actionField.option,
                    items: [
                        items.map((item) => ({
                            currency,
                            item_name: item.product.name,
                            item_id: item.product.sku,
                            price: JSON.stringify(item.prices?.price?.value),
                            item_category: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            item_list_name: item.product.categories.length > 0 ? item.product.categories[0].name : '',
                            quantity: JSON.stringify(item.quantity),
                            item_stock_status: item.product.stock_status === 'IN_STOCK' ? 'In stock' : 'Out stock',
                            item_sale_product: '',
                            item_reviews_count: '',
                            item_reviews_score: '',
                        })),

                    ],
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(dataLayerOpt);

        TagManager.dataLayer(dataLayerOpt);
    }
};
export const impressionTracking = (items, relativeCategory = '', currency = 'IDR') => {
    let categoryList = '';
    let categoryName = '';

    if (relativeCategory) {
       categoryList = relativeCategory;
       categoryName = relativeCategory.split(' > ').pop();
    }

    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                event: 'productImpression',
                eventAction: 'Product Impression',
                eventLabel: 'impression cart',
                ecommerce: {
                    currency,
                    impressions: items.map((item, index) => {
                        if (!relativeCategory) {
                            const categories = _sortCategories(item.categories);

                            categoryList = categories.join(" > ");
                            categoryName = categories.length > 0
                                ? categories.pop().name
                                : '';
                        }

                        return {
                            name: item.name,
                            id: item.sku,
                            category: categoryName,
                            price:
                                item.price_range.minimum_price.regular_price
                                    .value,
                            list: categoryList,
                            position: index + 1
                        };
                    })
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                event: 'view_item_list',
                pageName: categoryList,
                pageType: 'category',
                ecommerce: {
                    items: items.map((product, index) => {
                        if (!relativeCategory) {
                            const categories = _sortCategories(product.categories);

                            categoryList = categories.join(" > ");
                            categoryName = categories.length > 0
                                ? categories.pop().name
                                : '';
                        }
                        return {
                            item_name: product.name,
                            item_id: product.sku,
                            price: product.price_range.minimum_price.regular_price.value,
                            item_category: categoryName,
                            item_list_name: categoryList,
                            index,
                            currency: product.price_range.minimum_price.regular_price.currency,
                        };
                    }),
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const cartTracking = (items) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                pageName: 'cart',
                pageType: 'cart',
                event: 'view_cart',
                ecommerce: {
                    items: items.map((item) => ({
                        currency: item.custom_price.row_total.currency,
                        item_name: item.product.name,
                        item_id: item.product.sku,
                        price: item.custom_price.row_total.value,
                        quantity: item.quantity,
                        item_stock_status: item.product.stock_status,
                    })),
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        // Clear the previous ecommerce object.
        TagManager.dataLayer({ dataLayer: { ecommerce: null } });
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const productClickTracking = (item, relativeCategory = '') => {
    if (process.env.ENABLE_TRACKING_GTM) {
        let categoryList = '';
        let categoryName = '';

        if (relativeCategory) {
            categoryList = relativeCategory;
            categoryName = relativeCategory.split(' > ').pop();
        } else {
            const categories = _sortCategories(item.categories);
            const breadcrumbsNames = [];
            categories.forEach(({name}) => breadcrumbsNames.push(name));

            categoryList = breadcrumbsNames.join(" > ");
            categoryName = breadcrumbsNames.length > 0
                ? breadcrumbsNames.pop()
                : '';
        }

        const tagManagerArgs = {
            dataLayer: {
                event: 'productClick',
                eventAction: 'productClick',
                ecommerce: {
                    click: {
                        actionField: {
                            list: categoryList
                        },
                        products: [
                            {
                                name: item.name,
                                id: item.sku,
                                price:
                                    item.price_range.maximum_price.regular_price
                                        .value,
                                category: categoryName,
                                // brand: other.brand,
                                // variant: other.variant,
                                position: item.id
                            }
                        ]
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                event: 'select_item',
                ecommerce: {
                    action: {
                        items: [
                            {
                                currency: item.price_range.maximum_price.regular_price.currency || 'USD',
                                item_name: item.name,
                                item_id: item.sku,
                                price: item.price_range.maximum_price.regular_price.value,
                                item_category: categoryName,
                                item_stock_status: item.stock_status,
                            },
                        ],
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const productDetailTracking = (item) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                pageName: item.name,
                pageType: 'product',
                ecommerce: {
                    items: [
                        {
                            item_name: item.name,
                            item_id: item.sku,
                            price: item.priceRange.minimum_price.regular_price.value || 0,
                            currency: item.priceRange.minimum_price.regular_price.currency || 'USD',
                            item_stock_status: item.stockStatus,
                            item_reviews_score: item.reviews,
                            item_sale_product: item.sale === null ? 'NO' : 'YES',
                        },
                    ],
                },
                event: 'view_item',
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        // Clear the previous ecommerce object.
        TagManager.dataLayer({ dataLayer: { ecommerce: null } });
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const purchaseTracking = (
    orderNumber,
    total,
    tax,
    shippingCost,
    items,
    orderDetailsData
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                event: 'purchase',
                eventAction: 'purchase',
                ecommerce: {
                    purchase: {
                        actionField: {
                            id: orderNumber,
                            revenue: total,
                            tax,
                            shipping: shippingCost
                        },
                        products: items.map((item, index) => {
                            const categories = _sortCategories(
                                item.product.categories
                            );
                            const categoryName =
                                categories.length > 0
                                    ? categories.pop().name
                                    : '';

                            const brandIndex = categories.findIndex(
                                ({ name }) => name === 'Brand'
                            );
                            const brand = categories[brandIndex + 1] || {
                                name: ''
                            };

                            return {
                                id: item.product.sku,
                                brand: brand.name,
                                category: categoryName,
                                name: item.product.name,
                                price: item.prices?.price?.value,
                                quantity: item.quantity,
                                variant: ''
                            };
                        })
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                pageType: 'purchase',
                event: 'purchase',
                ecommerce: {
                    purchase: {
                        transaction_id: orderNumber,
                        affiliation: 'Guardian',
                        value: JSON.stringify(total),
                        coupon: '',
                        tax: JSON.stringify(tax),
                        shipping: JSON.stringify(shippingCost),
                        currency: orderDetailsData.cart.prices.grand_total.currency || 'USD',
                        total_order_count: items.length,
                        total_lifetime_value: JSON.stringify(total),
                        items: items.map((item) => ({
                            currency: item.product.price_range.maximum_price.final_price.currency || 'USD',
                            item_name: item.product.name,
                            item_id: item.product.sku,
                            price: JSON.stringify(item.prices?.price?.value),
                            quantity: JSON.stringify(item.quantity),
                        })),
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgs);

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }

    if (
        process.env.FACEBOOK_PIXEL_ENABLE === 'true' &&
        process.env.FACEBOOK_PIXEL_ID
    ) {
        purchaseFbPixel(items, orderNumber, total);
    }

};
export const orderSuccess = (orderNumber, total, tax, shippingCost, items, orderData) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                event: 'purchase',
                eventAction: 'purchase',
                ecommerce: {
                    purchase: {
                        actionField: {
                            id: orderNumber,
                            revenue: total,
                            tax,
                            shipping: shippingCost
                        },
                        products: items.map((item, index) => {
                            const categories = _sortCategories(item.categories);
                            const categoryName =
                                categories.length > 0
                                    ? categories.pop().name
                                    : '';

                            const brandIndex = categories.findIndex(
                                ({ name }) => name === 'Brand'
                            );
                            const brand = categories[brandIndex + 1] || {
                                name: ''
                            };

                            return {
                                id: item.sku,
                                brand: brand.name,
                                category: categoryName,
                                name: item.name,
                                price: item.price,
                                quantity: item.qty_ordered,
                                variant: ''
                            };
                        })
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                pageType: 'purchase',
                pageName: 'Success',
                event: 'purchase',
                ecommerce: {
                    purchase: {
                        transaction_id: orderNumber,
                        affiliation: 'Guardian',
                        value: JSON.stringify(total),
                        coupon: orderData.detail[0].aw_giftcard.giftcard_amount,
                        tax: JSON.stringify(tax),
                        shipping: JSON.stringify(shippingCost),
                        currency: 'IDR',
                        total_order_count: items.length,
                        total_lifetime_value: JSON.stringify(total),
                        items: items.map((item, review) => ({
                            currency: 'IDR',
                            item_name: item.name,
                            item_id: item.sku,
                            price: JSON.stringify(item.price),
                            quantity: JSON.stringify(item.qty_ordered),
                        })),
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
export const usageCoupon = (
    orderNumber,
    discount,
    giftCard,
    rewardPoint,
    storeCredit
) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                event: 'usageCoupon',
                eventAction: 'usageCoupon',
                ecommerce: {
                    click: {
                        actionField: {
                            id: orderNumber,
                            discount,
                            giftCard: giftCard || 0,
                            rewardPoint: rewardPoint || 0,
                            storeCredit: storeCredit || 0
                        }
                    }
                }
            }
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgs);

        TagManager.dataLayer(tagManagerArgs);
    }
};
export const removeToCartTracking = (id, product, prices, quantity) => {
    if (process.env.ENABLE_TRACKING_GTM) {
        const tagManagerArgs = {
            dataLayer: {
                event: 'removeFromCart',
                eventLabel: 'removeFromCart',
                label: product.name,
                ecommerce: {
                    currencyCode: prices.row_total ? prices.row_total.currency : prices.price.currency || 'USD',
                    remove: {
                        cartItem: id,
                        quantity: quantity,
                        product: {
                            name: product.name,
                            id: product.sku,
                            price: prices.row_total ? prices.row_total.value : prices.price.value,
                            dimensions4: product.stock_status || ''
                        }
                    }
                }
            }
        };

        // GA 4 dataLayer
        const tagManagerArgsGA4 = {
            dataLayer: {
                event: 'remove_from_cart',
                ecommerce: {
                    action: {
                        items: [
                            {
                                item_name: product.name,
                                item_id: product.sku,
                                price: prices.row_total ? prices.row_total.value : prices.price.value,
                                quantity: quantity,
                                currency: prices.row_total ? prices.row_total.currency : prices.price.currency || 'USD',
                            },
                        ],
                    },
                },
            },
        };

        if (process.env.GTM_DEBUG && process.env.NODE_ENV !== 'production')
            console.log(tagManagerArgsGA4);

        TagManager.dataLayer(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgsGA4);
    }
};
