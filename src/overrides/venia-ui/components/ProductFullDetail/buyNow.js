import { findPurchasableCartItemBySku } from '../../../../overrides/peregrine/talons/Gallery/cartItemMatching';

export const isSelectedProductInCart = (cartItems, sku, selectedOptions = []) => {
    return !!findPurchasableCartItemBySku(cartItems, sku, selectedOptions);
};
