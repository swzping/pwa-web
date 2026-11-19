export const isFreeGiftCartItem = item => {
    return (
        item?.is_free_gift === true ||
        item?.is_free_gift === 'true' ||
        item?.is_free_gift === 1 ||
        item?.is_free_gift === '1'
    );
};

const getCartItemSelectedOptionUids = item => {
    return (item?.configurable_options || [])
        .map(option => option?.configurable_product_option_value_uid || option?.value_uid || option?.value_id)
        .filter(Boolean);
};

const hasMatchingSelectedOptions = (item, selectedOptions = []) => {
    const cartItemSelectedOptionUids = getCartItemSelectedOptionUids(item);

    if (!selectedOptions.length) {
        return !cartItemSelectedOptionUids.length && !item?.configured_variant?.sku;
    }

    const selectedOptionUidSet = new Set(cartItemSelectedOptionUids);

    return selectedOptions.every(optionUid => selectedOptionUidSet.has(optionUid));
};

export const findPurchasableCartItemBySku = (cartItems, sku, selectedOptions = []) => {
    if (!Array.isArray(cartItems) || !sku) {
        return null;
    }

    return (
        cartItems.find(item => {
            if (isFreeGiftCartItem(item)) {
                return false;
            }

            return item?.product?.sku === sku && hasMatchingSelectedOptions(item, selectedOptions);
        }) || null
    );
};
