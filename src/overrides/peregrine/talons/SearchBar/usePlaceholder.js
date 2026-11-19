import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from './placeholder.gql';

export const usePlaceholder = () => {
    const { data, loading } = useQuery(DEFAULT_OPERATIONS.getPlaceholderQuery, {
        fetchPolicy: 'cache-and-network'
    });

    const placeholderData = useMemo(() => {
        let placeholder = '';

        if (data) {
            return (placeholder =
                data && data.storeConfig.pwa.placeholder_productsearch);
        } else {
            return (placeholder = 'Search...');
        }
    }, [data]);

    return {
        placeholderData,
        placeholderLoading: Boolean(loading)
    };
};
