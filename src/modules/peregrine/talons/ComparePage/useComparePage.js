import { useState, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { useToasts } from '@magento/peregrine';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { getCookies } from '../../util/cookies';

import compareOperations from '../Compare/compare.gql';
import defaultOperations from './comparePage.gql';

export const useComparePage = (props = {}) => {
    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();
    const [{ isSignedIn }] = useUserContext();
    const [columnWidth, setColumnWidth] = useState(null);
    // const [confirmDel, setConfirmDel] = useState(false);
    const { 
        getCompareListQuery, 
        getCustomerUidQuery,
        getLocalCompareListProductsQuery,
        removeProductsFromCompareListMutation,
    } = mergeOperations(defaultOperations, compareOperations);

    const { client: localClient } = useQuery(getLocalCompareListProductsQuery);

    const [getCustomerUid, { data: dataCustomerUid }] = useLazyQuery(getCustomerUidQuery, {
        fetchPolicy: 'cache-and-network',
    });

    const [removeProductsFromCompareList] = useMutation(removeProductsFromCompareListMutation);

    const [getCompareList, { 
        data, 
        error, 
        loading,
        refetch: refetchCompareList 
    }] = useLazyQuery(getCompareListQuery, {
        fetchPolicy: 'cache-and-network',
    });

    const derivedCompareList = (data && data.compareList) || {};

    // const confirmDelete = (item) => {
    //     setConfirmDel(true);
    //     setSelectDelet(item);
    // };
    // const cancelDelete = () => {
    //     setConfirmDel(false);
    //     setSelectDelet(null);
    // };

    const handleDeleteCompare = (productUid) => {
        // setConfirmDel(false);

        // window.backdropLoader(true);

        const uid = isSignedIn && dataCustomerUid && dataCustomerUid.customer && dataCustomerUid.customer.compare_list 
            ? dataCustomerUid.customer.compare_list.uid 
            : getCookies('uid_compare');
        
        const products = [];
        products.push(productUid.toString());

        removeProductsFromCompareList({ variables: { uid, products } })
            .then(async ({ data: { removeProductsFromCompareList: { items } }}) => {
                const respCompareListProducts = [];
                items.forEach(({ product }) => respCompareListProducts.push(product.sku.toString()));

                await localClient.writeQuery({
                    query: getLocalCompareListProductsQuery,
                    data: {
                        localCompareListProducts: [ ...respCompareListProducts ],
                    },
                });

                refetchCompareList();

                addToast({  
                    type: 'success', 
                    message: formatMessage({
                        id: 'comparePage.action.successAdded',
                        defaultMessage: 'Product added successfully to compare list'
                    }), 
                    timeout: 5000
                });
            })
            .catch(() => {
                addToast({
                    type: 'error',
                    message: formatMessage({
                        id: 'comparePage.action.failedRemove',
                        defaultMessage: 'Product failed to add to compare list'
                    }),
                    timeout: 5000
                });
            });
    };

    useEffect(() => {
        if (!isSignedIn) {
            const uid = getCookies('uid_compare');
            if (uid) getCompareList({ variables: { uid } });
        }
    }, []);

    useEffect(() => {
        if (isSignedIn && dataCustomerUid && dataCustomerUid.customer && dataCustomerUid.customer.compare_list) {
            const { uid } = dataCustomerUid.customer.compare_list;
            getCompareList({ variables: { uid } });
        }
    }, [dataCustomerUid, isSignedIn]);

    useEffect(() => {
        if (!loading && !columnWidth && derivedCompareList.items) {
            const totalColumns = derivedCompareList.items.length + 1;
            const calcColumnWidth = typeof window !== 'undefined' 
                ? window.innerWidth/totalColumns 
                : `${100/totalColumns}%`;

            setColumnWidth(calcColumnWidth);
        }
    }, [loading, derivedCompareList.items]);

    useEffect(() => {
        if (isSignedIn) getCustomerUid();
    }, [isSignedIn]);

    return {
        compareListData: derivedCompareList,
        columnWidth,
        error,
        handleDeleteCompare,
        loading,
    };
};