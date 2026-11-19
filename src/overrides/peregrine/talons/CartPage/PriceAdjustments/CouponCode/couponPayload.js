const splitCouponCodes = code =>
    String(code || '')
        .split(/[,\s]+/)
        .map(value => value.trim())
        .filter(Boolean);

export const buildCouponCodePayload = ({
    couponCode,
    dataAppliedCoupon,
    preserveExistingCoupons = true
}) => {
    const selectedCouponCodes = Array.isArray(couponCode)
        ? couponCode.flatMap(splitCouponCodes)
        : splitCouponCodes(couponCode);

    if (!preserveExistingCoupons) {
        return [...new Set(selectedCouponCodes)];
    }

    const existingCouponCodes = Array.isArray(dataAppliedCoupon)
        ? dataAppliedCoupon.flatMap(({ code }) => splitCouponCodes(code))
        : [];

    return [...new Set([...existingCouponCodes, ...selectedCouponCodes])];
};

export const getUnavailableCouponResults = coupons =>
    Array.isArray(coupons)
        ? coupons.filter(coupon => coupon && coupon.isApplied === '')
        : [];

export const getApplyCouponErrorMessage = coupons =>
    getUnavailableCouponResults(coupons).length
        ? 'The coupon does not applicable.'
        : null;

export const getCouponMutationErrorMessage = error =>
    error?.graphQLErrors?.[0]?.message ||
    error?.networkError?.result?.errors?.[0]?.message ||
    error?.message ||
    null;
