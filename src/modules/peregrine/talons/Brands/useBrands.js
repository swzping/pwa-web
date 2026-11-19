import { useState, useMemo, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import {
    getBrandsQuery,
    getBrandDetailsQuery,
    getBrandProductQuery,
    getStoreConfig
} from './brands.gql';

export const useBrands = props => {
    const { urlKey, brandId, brands } = props;

    const {
        data: brandsData,
        loading: brandsLoading,
        error: brandsError
    } = useQuery(getBrandsQuery, {
        fetchPolicy: 'no-cache'
    });

    const { data: storeConfigData } = useQuery(getStoreConfig, {
        fetchPolicy: 'cache-and-network'
    });

    const {
        data: brandDetailsData,
        loading: brandDetailsLoading,
        error: brandDetailsError
    } = useQuery(getBrandDetailsQuery, {
        variables: {
            urlKey: urlKey
        }
    });

    const [runQuery, queryResponse] = useLazyQuery(getBrandProductQuery);
    const {
        loading: brandProductLoading,
        error: brandProductError,
        data: brandProductData
    } = queryResponse;

    useEffect(() => {
        if (brandId) {
            runQuery({
                variables: {
                    filters: {
                        eq: brandId
                    }
                }
            });
        }
    }, [brandId, runQuery]);

    const [startWith, setStartWith] = useState('');
    const [brandSearchString, setBrandSearchString] = useState('');

    // filter brands by dictionary
    const brandsList = useMemo(() => {
        if (
            brandsData &&
            brandsData.getBrandList &&
            brandsData.getBrandList.items
        ) {
            let brandItems = brandsData.getBrandList.items;

            const filteredItems = [];
            brandItems.map(brandItem => {
                if (startWith && brandItem.attribute_id) {
                    if (brandItem.name.toLowerCase()[0] !== startWith) return;
                }
                filteredItems.push(brandItem);
            });
            return filteredItems;
        }
        return [];
    }, [brandsData, startWith]);

    // use this var for available dictionary options
    const availableChars = useMemo(() => {
        let availableChars = '';
        if (
            brandsData &&
            brandsData.getBrandList &&
            brandsData.getBrandList.items
        ) {
            brandsData.getBrandList.items.map(brandItem => {
                if (brandItem.attribute_id)
                    availableChars += brandItem.name.toLowerCase()[0];
            });
        }
        return availableChars;
    }, [brandsData]);

    const errors = useMemo(
        () =>
            new Map([
                ['getBrandsQuery', brandsError],
                ['getBrandDetailsQuery', brandDetailsError],
                ['getBrandProductQuery', brandProductError]
            ]),
        [brandsError, brandDetailsError, brandProductError]
    );

    return {
        brandsData,
        brandsList,
        brandsLoading,
        brandDetailsData,
        brandDetailsLoading,
        brandProductLoading,
        brandProductData,
        errors,
        availableChars,
        startWith,
        setStartWith,
        brandSearchString,
        setBrandSearchString,
        storeConfigData
    };
};
