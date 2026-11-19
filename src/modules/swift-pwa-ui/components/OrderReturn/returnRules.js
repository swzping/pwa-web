export const getReturnQuantity = item => Math.max(0, Math.floor(Number(item.returnable_quantity) || 0));

export const getAllowedSolutions = (options, eligibility) =>
    (options?.solutions || []).filter(solution => (eligibility?.solutions || []).includes(solution.code));

export const getAllowedReasons = (solution, eligibility) =>
    (solution?.reasons || []).filter(reason => eligibility?.reason_uids == null || eligibility.reason_uids.includes(reason.uid));

export const toOrderUid = id => /^\d+$/.test(String(id)) ? btoa(String(id)) : String(id);

export const validateUpload = (file, media) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const isVideo = (media?.video_extensions || []).includes(extension);
    const isImage = (media?.image_extensions || []).includes(extension);
    if (!isVideo && !isImage) return 'This file type is not allowed.';
    const limit = isVideo ? media.max_video_mb : media.max_image_mb;
    if (file.size > limit * 1024 * 1024) return `The file is too large. The maximum size is ${limit} MB.`;
    return '';
};

export const validateEvidence = (attachments, media) => {
    if (!media || media.enabled === false) return '';
    if (attachments.length < media.min_files) return `Please attach at least ${media.min_files} file(s).`;
    const countError = validateMediaCounts(attachments, media);
    if (countError) return countError;
    if (attachments.some(file => !file.token)) return 'Please wait for all files to upload.';
    if (media.video_required && !attachments.some(file => file.type.toLowerCase() === 'video')) return 'Please attach at least one video.';
    return '';
};

export const buildReturnInput = ({ order, items, quantities, solution, reason, otherText = '', notes = '', attachments, media }) => {
    if (!items.length) throw new Error('Please select at least one item.');
    const required = resolveReturnItems(order.items || items, items.map(item => item.id), quantities);
    if (required.some(item => !items.some(selected => selected.id === item.id))) throw new Error('Please return all items in the promotion and any required free gifts.');
    const requestItems = items.map(item => {
        const quantity = (quantities[item.id] == null ? getReturnQuantity(item) : quantities[item.id]);
        if ((item.return_together_key || isReturnGift(item)) && quantity !== getReturnQuantity(item)) throw new Error('Promotion items and required free gifts must be returned in full.');
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > getReturnQuantity(item)) {
            throw new Error('Please choose a valid return quantity.');
        }
        return { order_item_uid: item.id, quantity_to_return: quantity };
    });
    return {
        order_uid: toOrderUid(order.id),
        items: requestItems,
        solution,
        reason_uid: reason.uid,
        ...(reason.requires_text ? { reason_other_text: otherText.trim() } : {}),
        ...(notes.trim() ? { comment_text: notes.trim() } : {}),
        attachment_tokens: media?.enabled ? attachments.map(file => file.token) : []
    };
};

export const isReturnGift = item => item.is_gift_with_purchase === true;

export const toggleReturnSelection = (items, ids, itemId) => {
    const item = items.find(entry => entry.id === itemId);
    if (!item || isReturnGift(item)) return ids;
    const group = items.filter(entry => getReturnQuantity(entry) > 0 &&
        (entry.id === itemId || (item.return_together_key && entry.return_together_key === item.return_together_key)));
    const groupIds = group.map(entry => entry.id);
    return ids.includes(itemId) ? ids.filter(id => !groupIds.includes(id)) : [...new Set([...ids, ...groupIds])];
};

export const resolveReturnItems = (items, ids, quantities = {}) => {
    const available = (items || []).filter(item => getReturnQuantity(item) > 0);
    const keys = new Set(available.filter(item => ids.includes(item.id) && !isReturnGift(item)).map(item => item.return_together_key).filter(Boolean));
    const selected = available.filter(item => (!isReturnGift(item) && ids.includes(item.id)) || (item.return_together_key && keys.has(item.return_together_key)));
    const paid = available.filter(item => !isReturnGift(item));
    const fullReturn = paid.length > 0 && paid.every(item => selected.includes(item) &&
        (item.return_together_key || quantities[item.id] == null || quantities[item.id] === getReturnQuantity(item)));
    return fullReturn ? available.filter(item => selected.includes(item) || isReturnGift(item)) : selected;
};

export const validateMediaCounts = (files, media) => {
    if (files.length > media.max_files) return `You can attach at most ${media.max_files} files.`;
    const videos = files.filter(file => String(file.type).toLowerCase() === 'video').length;
    const images = files.filter(file => String(file.type).toLowerCase() === 'image').length;
    if (media.max_video_files != null && videos > media.max_video_files) return `You can attach at most ${media.max_video_files} videos.`;
    if (media.max_image_files != null && images > media.max_image_files) return `You can attach at most ${media.max_image_files} photos.`;
    return '';
};

export const getRefundTotal = rows => {
    if (!rows.length || rows.some(({ item, quantity }) => item?.refundable_unit_price?.value == null || !item.refundable_unit_price.currency || !Number.isFinite(quantity))) return null;
    const currency = rows[0].item.refundable_unit_price.currency;
    if (rows.some(({ item }) => item.refundable_unit_price.currency !== currency)) return null;
    return { currency, value: rows.reduce((sum, { item, quantity }) => sum + item.refundable_unit_price.value * quantity, 0) };
};
