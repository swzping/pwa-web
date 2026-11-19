import ReactPixel from 'react-facebook-pixel';

export const viewContentFbPixel = (sku, name, price, currency) => {
    ReactPixel.track('ViewContent', {
        content_type: 'product',
        content_ids: [sku],
        content_name: name,
        value: price,
        currency: currency
    });
};

export const addTocartFbPixel = (name = '', price = 0, currency, sku = '', qty) => {
    ReactPixel.track('AddToCart', {
        content_name: name,
        content_ids: [sku],
        content_type: 'product',
        currency: currency,
        value: parseInt(price),
        contents: [{
            id: sku,
            quantity: qty,
        }],
    });
};

export const addToWishlistFbPixel = (name = '', price = 0, currency, sku = '', category, qty) => {
    ReactPixel.track('AddToWishlist', {
        content_name: name,
        content_category: category,
        content_ids: [sku],
        currency: currency,
        value: parseInt(price),
        contents: [{
            id: sku,
            quantity: qty
        }],
    });
};

export const purchaseFbPixel = (items, orderNumber, total) => {
    ReactPixel.track('Purchase', {
        transaction_id: orderNumber,
        value: total,
        currency: 'IDR',
        contents: items.map(({ product: { sku }, quantity }) => ({ id: sku, quantity })),
        content_ids: items.map(({ product: { sku } }) => sku),
        content_type: 'product_group',
    });
};
