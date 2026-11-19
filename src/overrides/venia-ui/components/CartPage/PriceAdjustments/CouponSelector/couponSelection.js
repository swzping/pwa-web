export const canConfirmCouponSelection = ({
    isCheckout,
    selectedCouponCode,
    appliedCouponCodes = []
}) => Boolean(selectedCouponCode) || (isCheckout && appliedCouponCodes.length > 0);
