const shouldResetLoyaltyPoints = (appliedPoints, grandTotal) => {
    const pointRedemption = Number(appliedPoints);
    const total = Number(grandTotal);

    return pointRedemption > 0 && total > 0 && total < pointRedemption;
};

module.exports = {
    shouldResetLoyaltyPoints
};
