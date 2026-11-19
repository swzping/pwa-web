const getEffectiveStockStatus = ({ currentStockStatus, productDetails } = {}) =>
    currentStockStatus || productDetails?.stock_status;

export { getEffectiveStockStatus };
