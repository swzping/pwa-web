import { useCallback, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';

import { useUserContext } from '@magento/peregrine/lib/context/user';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { getCookies, setCookies } from '../../../util/cookies';

import rootOperations from '../compare.gql';
import compareOperations from '../../ComparePage/comparePage.gql';

export const useIconBadgeButton = () => {
    const { 
        createCompareListMutation,
        getCustomerUidQuery,
        getLocalCompareListProductsQuery,
    } = mergeOperations(rootOperations, compareOperations);
    
    const history = useHistory(); 
    const { formatMessage } = useIntl();
    const [{ isSignedIn }] = useUserContext();

    const [ 
        createCompareList, 
        { 
            data: createCompareData, 
            error: errorCreateCompare, 
            loading: loadingCreateCompare, 
        } 
    ] = useMutation(createCompareListMutation);

    const { data: localCompareListData } = useQuery(getLocalCompareListProductsQuery);

    const [
        getCustomerUid, 
        { 
            data: dataCustomerUid,
            loading: loadingCustomerUid
        }
    ] = useLazyQuery(getCustomerUidQuery, {
        fetchPolicy: 'cache-and-network',
    });

    const localCompareListProducts = localCompareListData && localCompareListData.localCompareListProducts 
        ? localCompareListData.localCompareListProducts
        : [];

    const itemCount  = useMemo(() => localCompareListProducts.length, [localCompareListProducts]);

    const errorToastProps = useMemo(() => {
        if (errorCreateCompare) {
            return {
                type: 'error',
                message: formatMessage({
                    id: 'compare.fetchError',
                    defaultMessage:
                        'Something went wrong fetching compare list data.'
                }),
                timeout: 5000
            };
        }

        return null;
    }, [errorCreateCompare, formatMessage]);
    
    const handleLinkClick = useCallback(() => {
        // Send the user to the product compare page.
        history.push('/product-compare');
    }, [history]);
    

    useEffect(() => {
        if (!isSignedIn) {
            const guestUid = getCookies('uid_compare');
            if (!guestUid) createCompareList({ variables: { uid: [] }});
        }else {
            getCustomerUid();
        }
    }, [isSignedIn]);

    useEffect(() => {
        if (
            !loadingCustomerUid 
            && dataCustomerUid 
            && dataCustomerUid.customer 
            && dataCustomerUid.customer.compare_list
        ) {
            setCookies('uid_compare', dataCustomerUid.customer.compare_list.uid);
        }
    }, [dataCustomerUid]);

    useEffect(() => {
        if (!loadingCreateCompare && createCompareData && createCompareData.createCompareList) {
            setCookies('uid_compare', createCompareData.createCompareList.uid);
        }
    }, [createCompareData]);
    
    return {
        errorToastProps, 
        handleLinkClick, 
        itemCount
    };
};
