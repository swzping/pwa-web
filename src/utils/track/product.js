import { getFiltersFromSearch } from '@magento/peregrine/lib/talons/FilterModal/helpers';

// 跟踪SKU列表曝光情况查看
export const trackSkuListExposureView = params => {
    if (window?.QDTracker?.track) {
        const { locationName = '', name = '', sku = '' } = params || {};

        const newParams = {
            location_name: locationName,
            sku_name: name,
            sku_id: sku
        };
        window.QDTracker.track('sku_component_exposure', newParams);
    }
};

// 获取SKU列表名称及sku
const getExtractSkuAndName = (products = []) => {
    const skuList = [];
    const nameList = [];
    for (const { sku, name } of products) {
        if (sku) skuList.push(sku);
        if (name) nameList.push(name);
    }
    return {
        skuString: skuList.join(','),
        nameString: nameList.join(',')
    };
};
export const trackSkuComponentFilter = (search, params) => {
    if (window?.QDTracker?.track) {
        const { name = '', sku = '' } = params || {};
        if (search) {
            try {
                const searchRes = getFiltersFromSearch(search || {}); // 获取过滤条件
                // 获取价格区间
                const priceStr = [...(searchRes.get('price') || [])].join(',');
                // 获取品牌
                const brandStr = [...(searchRes.get('brand') || [])].join(',');
                // 获取分类
                const categoryStr = [
                    ...(searchRes.get('category_uid') || [])
                ].join(',');
                const newParams = {
                    location_name: window?.location?.pathname || '',
                    price_scope: priceStr,
                    category_name: categoryStr,
                    brand_name: brandStr,
                    sku_name: name,
                    sku_id: sku
                };
                if (
                    newParams.price_scope ||
                    newParams.brand_name ||
                    newParams.category_name
                ) {
                    window.QDTracker.track('sku_component_filter', newParams);
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
};

// 跟踪公用SKU列表曝光视图
export const trackCommonSkuListExposureView = params => {
    if (window?.QDTracker?.track) {
        const search = window.location.search || '';
        const searchRes = getFiltersFromSearch(search || {}); // 获取过滤条件
        if (searchRes.size > 0) {
            trackSkuComponentFilter(search, params);
        } else {
            trackSkuListExposureView(params);
        }
    }
};

// 跟踪SKU组件查看
export const trackSkuComponentView = params => {
    if (window?.QDTracker?.track) {
        const { product, urlKey } = params || {};
        const { name = '', sku = '', price } = product || {};
        const priceValue =
            product?.price_range?.minimum_price?.final_price?.value ||
            product?.special_price;
        window.QDTracker?.track('view_sku_pdp', {
            sku_name: name,
            sku_id: sku,
            sku_current_price: priceValue || 0,
            location_name: urlKey
        });
    }
};

// 跟踪SKU组件点击
export const trackSkuComponentClick = params => {
    if (window?.QDTracker?.track) {
        const { locationName = '', name = '', sku = '' } = params || {};
        window.QDTracker.track('click_sku_component', {
            location_name: locationName,
            sku_name: name,
            sku_id: sku
        });
    }
};

// 跟踪产品分享
export const trackProductShare = params => {
    if (window?.QDTracker?.track) {
        const { name = '', sku = '' } = params || {};
        window.QDTracker.track('product_share', {
            location_name: window.location.href,
            sku_name: name,
            sku_id: sku
        });
    }
};

// 跟踪产品加入收藏
export const trackProductAddToWishlist = (params, quantity) => {
    if (window?.QDTracker?.track) {
        const { name = '', sku = '' } = params || {};
        window.QDTracker.track('add_to_wishlist', {
            location_name: window.location.pathname,
            sku_name: name,
            sku_id: sku
        });
    }
};

// 跟踪产品加入购物车
export const trackProductAddToWCart = (params, quantity, relativePath) => {
    if (window?.QDTracker?.track) {
        const { name = '', sku = '', price = {} } = params || {};
        const priceValue =
            params?.price_range?.minimum_price?.final_price?.value ||
            params?.special_price;
        const pathname = window.location.pathname;
        window.QDTracker.track('add_to_cart', {
            location_name: relativePath || pathname,
            sku_name: name,
            sku_id: sku,
            sku_current_price: priceValue || 0
        });
    }
};

// 跟踪产品提交订单
export const trackProductSubmitOrder = (orderNumber, params) => {
    if (window?.QDTracker?.track) {
        try {
            const { selected_payment_method, shipping_addresses, prices } =
                params?.cart || {};
            const { selected_shipping_method: shop_method } =
                shipping_addresses?.[0] || {};
            const { method_title = '', carrier_title = '' } = shop_method || {};
            const infos = JSON.parse(
                sessionStorage.getItem('getSelectStoreAddress') || '{}'
            );
            const newParams = {
                order_id: orderNumber,
                pharmacy_name: infos?.loc_name || '',
                delivery_method: 'home delivery', // TODO:目前先固定为home delivery
                payment_method: selected_payment_method?.code,
                shipping_method: `${method_title || ''}-${carrier_title || ''}`,
                order_total: prices?.grand_total?.value
            };
            window.QDTracker.track('submit_order', newParams);
            sessionStorage.removeItem('getSelectStoreAddress');
        } catch (error) {
            console.log(err);
            sessionStorage.removeItem('getSelectStoreAddress');
        }
    }
};
