const toNumber = value => {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
};

export const getGiftId = gift => {
    return gift?.sku || gift?.product_id || gift?.name;
};

export const getInitialGiftQuantity = gift => {
    const reservedQty = toNumber(gift?.reserved_qty);

    return reservedQty > 0 ? reservedQty : 1;
};

export const getGiftMaxQuantity = gift => {
    const allowedQty = toNumber(gift?.allowed_qty);

    return allowedQty > 0 ? allowedQty : 1;
};

export const normalizeGiftOption = gift => {
    return {
        ...gift,
        id: getGiftId(gift),
        image: gift?.image_url || '',
        quantity: getInitialGiftQuantity(gift),
        maxQuantity: getGiftMaxQuantity(gift)
    };
};

export const isGiftReserved = gift => {
    return toNumber(gift?.reserved_qty) >= 1;
};

export const normalizeMaxSelect = maxSelect => {
    const normalizedMaxSelect = toNumber(maxSelect);

    return normalizedMaxSelect > 0 ? normalizedMaxSelect : 1;
};

export const isGiftSelectionComplete = ({ selectedCount, maxSelect }) => {
    return toNumber(selectedCount) >= normalizeMaxSelect(maxSelect);
};

export const getGiftConfirmButtonLabel = ({
    selectedCount,
    maxSelect,
    isSubmitting
}) => {
    if (isSubmitting) {
        return 'Confirming...';
    }

    const normalizedMaxSelect = normalizeMaxSelect(maxSelect);

    if (toNumber(selectedCount) >= normalizedMaxSelect) {
        return 'Confirm';
    }

    return `${toNumber(selectedCount)} of ${normalizedMaxSelect} Selected`;
};

export const buildFreeGiftOptionsInput = ({ cartId, itemId }) => {
    return {
        cart_id: cartId,
        item_id: Number(itemId)
    };
};

export const buildSwapFreeGiftInput = ({
    cartId,
    itemId,
    selectedGift,
    quantity,
    selections
}) => {
    return {
        cart_id: cartId,
        item_id: Number(itemId),
        selections: selections || [
            {
                sku: selectedGift?.sku,
                qty: quantity
            }
        ]
    };
};
