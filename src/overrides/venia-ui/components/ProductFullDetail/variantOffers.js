const getPdpOffers = (parentProduct, selectedVariant) => {
    if (selectedVariant) {
        return selectedVariant.offers || [];
    }

    return parentProduct?.offers || [];
};

export { getPdpOffers };
