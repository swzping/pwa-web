export const normalizeImageUrl = imagePath => {
    if (!imagePath) {
        return null;
    }

    if (/^https?:\/\//.test(imagePath) || imagePath.indexOf('/media/') === 0) {
        return imagePath;
    }

    return `/media/catalog/product${imagePath}`;
};

const resolveFirstImageUrl = imageCandidates => imageCandidates.map(normalizeImageUrl).find(Boolean) || null;

export const getSelectedOptionSwatchImage = () => {
    return null;
};

export const getProductImageUrl = (productData, selectedVariant) => {
    return resolveFirstImageUrl([
        selectedVariant?.media_gallery_entries?.[0]?.file,
        selectedVariant?.media_gallery_entries?.[0]?.url,
        selectedVariant?.small_image?.url,
        selectedVariant?.thumbnail?.url,
        productData?.small_image?.url,
        productData?.image?.url,
        productData?.thumbnail?.url,
        productData?.media_gallery_entries?.[0]?.file,
        productData?.media_gallery_entries?.[0]?.url,
    ]);
};
