const createFreeGiftItem = (item, gift, index, totalGifts) => {
    const currency =
        gift?.price?.currency || item?.custom_price?.row_total?.currency;
    const value = gift?.price?.value || 0;
    const itemId = item.id || item.uid;
    const giftId = `${index}-${gift?.sku || 'gift'}`;

    return {
        ...item,
        id: `${itemId}-free-gift-${giftId}`,
        uid: `${itemId}-free-gift-${giftId}`,
        quantity: gift?.qty || 1,
        is_free_gift: true,
        is_last_free_gift: index === totalGifts - 1,
        free_gift_parent_item_id: item.id,
        free_gift_data: [],
        custom_price: {
            ...item.custom_price,
            row_total: {
                ...item.custom_price?.row_total,
                currency,
                value
            }
        },
        custom_cart_discount: [],
        validOffers: [{ promotion_type: 'Free Gift', name: 'Free Gift' }],
        product: {
            ...item.product,
            name: gift?.name || item.product?.name,
            sku: gift?.sku || item.product?.sku,
            url_key: gift?.url_key || item.product?.url_key,
            promo: null,
            is_flash_sale: 0,
            special_from_date: null,
            special_to_date: null,
            small_image: {
                ...item.product?.small_image,
                url: gift?.image_url || item.product?.small_image?.url
            }
        }
    };
};

const isFreeGiftItem = item => {
    return (
        item?.is_free_gift === true ||
        item?.is_free_gift === 'true' ||
        item?.is_free_gift === 1 ||
        item?.is_free_gift === '1'
    );
};

const hasCartItemIdentity = item => {
    return item?.id || item?.uid;
};

export const getCartItemsWithFreeGifts = items => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.reduce((result, item) => {
        if (!hasCartItemIdentity(item) || isFreeGiftItem(item)) {
            return result;
        }

        const gifts = Array.isArray(item?.free_gift_data)
            ? item.free_gift_data
            : [];
        const freeGiftItems = gifts.map((gift, index) =>
            createFreeGiftItem(item, gift, index, gifts.length)
        );
        const parentItem = freeGiftItems.length
            ? {
                  ...item,
                  has_free_gifts: true
              }
            : item;

        return result.concat(parentItem, freeGiftItems);
    }, []);
};

const createUnavailableDemoItem = item => {
    const itemId = item.id || item.uid;

    return {
        ...item,
        id: `${itemId}-unavailable-demo`,
        uid: `${itemId}-unavailable-demo`,
        is_unavailable_demo: true,
        unavailable_label: 'Home Delivery'
    };
};

export const getCartItemDisplayGroups = items => {
    const availableItems = getCartItemsWithFreeGifts(items);

    if (!Array.isArray(items)) {
        return {
            availableItems,
            unavailableItems: []
        };
    }

    const sourceItems = items.filter(
        item => hasCartItemIdentity(item) && !isFreeGiftItem(item)
    );
    const _demoItems =
        sourceItems.length >= 2
            ? sourceItems.slice(0, 2)
            : sourceItems.concat(sourceItems).slice(0, 2);
    const demoItems = []

    return {
        availableItems,
        unavailableItems: demoItems.map(createUnavailableDemoItem)
    };
};
