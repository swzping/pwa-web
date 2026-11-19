import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import {
    getAppliedStoreCreditQuery,
    getStoreCreditQuery,
    applyStoreCreditMutation,
    removeStoreCreditMutation
} from './storeCredit.gql';

export const useStoreCredit = props => {
    const { setIsCartUpdating } = props;
    const [status, setStatus] = useState(false);

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();

    const appliedStoreCreditResult = useQuery(getAppliedStoreCreditQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !cartId,
        variables: { cartId }
    });

    const { data, error: fetchError } = useQuery(getStoreCreditQuery, {
        skip: !isSignedIn
    });

    const [
        applyStoreCredit,
        {
            called: applyStoreCreditCalled,
            data: applyStoreCreditData,
            error: applyError,
            loading: applyingStoreCredit
        }
    ] = useMutation(applyStoreCreditMutation);

    const [
        removeStoreCredit,
        {
            called: removeStoreCreditCalled,
            error: removeStoreCreditError,
            loading: removingStoreCredit
        }
    ] = useMutation(removeStoreCreditMutation);

    const handleApplyStoreCredit = useCallback(async () => {
        try {
            if (!isSignedIn) return;
            await applyStoreCredit({
                variables: {
                    cartId
                }
            });
            setStatus(true);
        } catch (e) {
            // Error is logged by apollo link - no need to double log.
        }
    }, [applyStoreCredit, cartId, setStatus]);

    const handleRemoveStoreCredit = useCallback(async () => {
        try {
            await removeStoreCredit({
                variables: {
                    cartId
                }
            });
            setStatus(false);
        } catch (e) {
            // Error is logged by apollo link - no need to double log.
        }
    }, [cartId, removeStoreCredit, setStatus]);

    useEffect(() => {
        if (applyStoreCreditCalled || removeStoreCreditCalled) {
            // If a reward point mutation is in flight, tell the cart.
            setIsCartUpdating(applyingStoreCredit || removingStoreCredit);
        }
    }, [
        applyStoreCreditCalled,
        applyingStoreCredit,
        removeStoreCreditCalled,
        removingStoreCredit,
        setIsCartUpdating
    ]);

    // Create a memoized error map and toggle individual errors when they change
    const errors = useMemo(
        () =>
            new Map([
                ['getStoreCreditQuery', fetchError],
                ['applyStoreCreditMutation', applyError],
                ['removeStoreCreditMutation', removeStoreCreditError]
            ]),
        [applyError, removeStoreCreditError]
    );

    return {
        applyingStoreCredit,
        storeCreditData:
            appliedStoreCreditResult.data &&
            appliedStoreCreditResult.data.cart.applied_store_credit,
        data,
        errors,
        handleApplyStoreCredit,
        handleRemoveStoreCredit,
        status,
        applyStoreCreditData,
        removingStoreCredit
    };
};
