export const refreshCheckoutCouponData = async ({
    refreshPriceSummary,
    refreshPaymentInformation
} = {}) => {
    await refreshPriceSummary?.();
    refreshPaymentInformation?.();
};
