import { useState } from 'react';
import { useQuery } from '@apollo/client';

import { useCustomerWishlistSkus } from '@magento/peregrine/lib/hooks/useCustomerWishlistSkus/useCustomerWishlistSkus';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import defaultOperations from '@magento/peregrine/lib/talons/Gallery/gallery.gql';

export const useGallery = (props = {}) => {
    const [quickviewDataUrlKey, setQuickviewDataUrlKey] = useState();

    const operations = mergeOperations(defaultOperations, props.operations);

    useCustomerWishlistSkus();

    const { data: storeConfigData } = useQuery(operations.getStoreConfigQuery, {
        fetchPolicy: 'cache-and-network'
    });

    const handleQuickviewClose = () => setQuickviewDataUrlKey(null);

    const handleQuickviewOpen = (item) => {
        const urlKey = item.variant_parent_url_key || item.url_key;
        const selectedOptions = Array.isArray(item.variant_preselected_options)
            ? item.variant_preselected_options
            : [];

        setQuickviewDataUrlKey(
            item.variant_parent_sku && selectedOptions.length
                ? `${urlKey}?selected_options=${selectedOptions.map(encodeURIComponent).join(',')}`
                : urlKey
        );
    };

    const isOpenQuickview = !!process.env.GALLERYITEM_QUICKVIEW_ENABLE && !!quickviewDataUrlKey;

    const storeConfig = storeConfigData ? storeConfigData.storeConfig : null;

    return {
        handleQuickviewClose,
        handleQuickviewOpen,
        isOpenQuickview,
        quickviewDataUrlKey,
        storeConfig,
    };
};
