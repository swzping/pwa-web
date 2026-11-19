import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import {
    getAppliedRewardPoint,
    getRewardPointQuery,
    applyRewardPointMutation,
    removeRewardPointMutation
} from './rewardPoint.gql';

export const useRewardPoint = props => {
    const { setIsCartUpdating } = props;
    const [status, setStatus] = useState(false);

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();

    const { data, error: fetchError } = useQuery(getRewardPointQuery, {
        fetchPolicy: 'cache-and-network',
        skip: !isSignedIn
    });

    const appliedRewardPointResult = useQuery(getAppliedRewardPoint, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !cartId,
        variables: { cartId }
    });

    const [
        applyRewardPoint,
        {
            called: applyRewardPointCalled,
            error: applyError,
            loading: applyingRewardPoint
        }
    ] = useMutation(applyRewardPointMutation);

    const [
        removeRewardPoint,
        {
            called: removeRewardPointCalled,
            error: removeRewardPointError,
            loading: removingRewardPoint
        }
    ] = useMutation(removeRewardPointMutation);

    const handleApplyRewardPoint = useCallback(async () => {
        try {
            if (!isSignedIn) return;
            setStatus(false);
            await applyRewardPoint({
                variables: {
                    cartId,
                    myPoint: data.customerRewardPoints.balance || 0
                }
            });
            setStatus(true);
        } catch (e) {
            // Error is logged by apollo link - no need to double log.
        }
    }, [applyRewardPoint, cartId, data, setStatus]);

    const handleRemoveRewardPoint = useCallback(async () => {
        try {
            setStatus(true);
            await removeRewardPoint({
                variables: {
                    cartId
                }
            });
            setStatus(false);
        } catch (e) {
            // Error is logged by apollo link - no need to double log.
        }
    }, [removeRewardPoint, cartId, setStatus]);

    useEffect(() => {
        if (applyRewardPointCalled || removeRewardPointCalled) {
            // If a reward point mutation is in flight, tell the cart.
            setIsCartUpdating(applyingRewardPoint || removingRewardPoint);
        }
    }, [
        applyRewardPointCalled,
        applyingRewardPoint,
        removeRewardPointCalled,
        removingRewardPoint,
        setIsCartUpdating
    ]);

    // Create a memoized error map and toggle individual errors when they change
    const errors = useMemo(
        () =>
            new Map([
                ['getRewardPointQuery', fetchError],
                ['applyRewardPointMutation', applyError],
                ['removeRewardPointMutation', removeRewardPointError]
            ]),
        [applyError, fetchError, removeRewardPointError]
    );

    return {
        applyingRewardPoint,
        rewardPointData:
            appliedRewardPointResult.data &&
            appliedRewardPointResult.data.cart.applied_reward_points,
        data,
        errors,
        status,
        handleApplyRewardPoint,
        handleRemoveRewardPoint,
        removingRewardPoint
    };
};
