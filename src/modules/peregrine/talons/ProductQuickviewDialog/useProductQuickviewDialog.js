import { useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client';

import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/RootComponents/Product/product.gql';

export const useProductQuickviewDialog = (props) => {
    const { urlKey, storeConfig, onClose } = props;
    const { getProductDetailQuery } = mergeOperations(DEFAULT_OPERATIONS);
    const [productUrlKey, selectedOptionUids] = useMemo(() => {
        const [key, queryString = ''] = (urlKey || '').split('?');
        const options = new URLSearchParams(queryString)
            .get('selected_options')
            ?.split(',')
            .map(decodeURIComponent)
            .filter(Boolean) || [];

        return [key, options];
    }, [urlKey]);

    const { data, loading: productDetailLoading } = useQuery(getProductDetailQuery, {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        skip: !productUrlKey,
        variables: { urlKey: productUrlKey }
    });

    const productDetail = useMemo(() => {
        if (
            data
            && data.products
            && data.products.items
            && data.products.items.length > 0
        ) {
            return {
                ...data.products.items[0],
                variant_preselected_options: selectedOptionUids
            };
        }

        return {};
    }, [data, selectedOptionUids]);

    const productDetailLink = useMemo(() => {
        if (
            data
            && data.products
            && data.products.items
            && data.products.items.length > 0
        ) {
            const { url_key } = data.products.items[0];
            const productUrlSuffix = storeConfig && storeConfig.product_url_suffix;
            return resourceUrl(`/${url_key}${productUrlSuffix || ''}`);
        }

        return '';
    }, [data, storeConfig]);


    const handleOnClose = useCallback(() => {
        onClose();
    }, []);
    return {
        handleOnClose,
        productDetail,
        productDetailLink,
        productDetailLoading,
    }
};
