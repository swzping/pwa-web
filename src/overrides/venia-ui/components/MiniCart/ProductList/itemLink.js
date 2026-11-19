const getConfigurableOptionUid = option =>
    option?.configurable_product_option_value_uid || option?.value_uid || option?.value_id;

const getMiniCartItemLinkPath = ({ configurableOptions = [], product }) => {
    const selectedOptionUids = configurableOptions.map(getConfigurableOptionUid).filter(Boolean);
    const productPath = `/${product.url_key}${product.url_suffix || ''}`;

    if (!selectedOptionUids.length) {
        return productPath;
    }

    return `${productPath}?selected_options=${selectedOptionUids.map(encodeURIComponent).join(',')}`;
};

export { getMiniCartItemLinkPath };
