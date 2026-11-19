const shouldShowCartItemVariant = item =>
    !item?.is_free_gift && !item?.is_gamification_free_gift;

module.exports = shouldShowCartItemVariant;
