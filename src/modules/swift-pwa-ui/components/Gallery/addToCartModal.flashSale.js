const parseSaleDate = value => {
    if (!value) return NaN;
    const date = value.trim().replace(' ', 'T');
    return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) ? date : `${date}Z`);
};

export const getFlashSaleCountdown = (product, now) => {
    if (product?.is_flash_sale !== 1) return null;

    const end = parseSaleDate(product.special_to_date);
    const start = product.special_from_date ? parseSaleDate(product.special_from_date) : null;
    if (!Number.isFinite(end) || end <= now || (start !== null && (!Number.isFinite(start) || start > now))) {
        return null;
    }

    const seconds = Math.ceil((end - now) / 1000);
    return {
        hours: String(Math.floor(seconds / 3600)).padStart(2, '0'),
        minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'),
        seconds: String(seconds % 60).padStart(2, '0'),
    };
};

export const getFlashSaleOptionUids = (product, groups, selectedOptions, now) => {
    const activeVariants = (product?.variants || [])
        .filter(variant => getFlashSaleCountdown(variant.product, now))
        .map(variant => new Set((variant.attributes || []).map(attribute => {
            const group = groups.find(option => option.attributeCode === attribute.code);
            return attribute.uid || group?.values.find(value =>
                String(value.value_index) === String(attribute.value_index)
            )?.uid;
        }).filter(Boolean)));

    const optionUids = new Set();
    groups.forEach(group => {
        const otherSelections = groups.filter(other => other.id !== group.id)
            .map(other => selectedOptions[other.id]).filter(Boolean);
        group.values.forEach(value => {
            if (activeVariants.some(uids => uids.has(value.uid) && otherSelections.every(uid => uids.has(uid)))) {
                optionUids.add(value.uid);
            }
        });
    });
    return optionUids;
};
