import { useCallback, useEffect, useState, useMemo } from 'react';
import { useFormApi } from 'informed';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';

import { useCartContext } from '@magento/peregrine/lib/context/cart';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from './giftCardQueries.gql';

// To keep track of the most recent action taken.
const actions = {
    APPLY: 'apply',
    CHECK_BALANCE: 'check',
    REMOVE: 'remove'
};

export const useGiftCards = props => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const {
        getAppliedGiftCardsQuery,
        getGiftCardBalanceQuery,
        applyGiftCardMutation,
        removeGiftCardMutation
    } = operations;

    const { setIsCartUpdating } = props;

    // We need the cartId for all of our queries and mutations.
    const [{ cartId }] = useCartContext();

    const formApi = useFormApi();

    /*
     * Apollo hooks.
     *
     * Immediately execute the cart query and set up the other graphql actions.
     */
    const appliedCardsResult = useQuery(getAppliedGiftCardsQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !cartId,
        variables: { cartId }
    });

    const [checkCardBalance, balanceResult] = useLazyQuery(
        getGiftCardBalanceQuery,
        {
            // For security, always fetch this from the network and never cache the
            // result.
            fetchPolicy: 'no-cache'
        }
    );

    const [applyCard, applyCardResult] = useMutation(applyGiftCardMutation);
    const [removeCard, removeCardResult] = useMutation(removeGiftCardMutation);

    /*
     *  useState hooks.
     */
    const [mostRecentAction, setMostRecentAction] = useState(null);

    /*
     * useCallback hooks.
     */
    const applyGiftCard = useCallback(async () => {
        try {
            setMostRecentAction(actions.APPLY);

            const giftCardCode = formApi.getValue('card');

            await applyCard({
                variables: {
                    cartId,
                    giftCardCode: giftCardCode,
                    giftCard: giftCardCode
                }
            });

            // Clear the input form after successful apply.
            formApi.reset();
        } catch (err) {
            // do nothing
        }
    }, [formApi, applyCard, cartId]);

    const checkGiftCardBalance = useCallback(async () => {
        setMostRecentAction(actions.CHECK_BALANCE);

        const giftCardCode = formApi.getValue('card');

        await checkCardBalance({
            variables: { giftCardCode }
        });
    }, [formApi, checkCardBalance]);

    const removeGiftCard = useCallback(
        async giftCardCode => {
            setMostRecentAction(actions.REMOVE);

            try {
                await removeCard({
                    variables: {
                        cartId,
                        giftCardCode: giftCardCode,
                        giftCard: giftCardCode
                    }
                });
            } catch (err) {
                // do nothing
            }
        },
        [cartId, removeCard]
    );

    const {
        called: applyCardCalled,
        loading: applyCardLoading
    } = applyCardResult;
    const {
        called: removeCardCalled,
        loading: removeCardLoading
    } = removeCardResult;

    useEffect(() => {
        if (applyCardCalled || removeCardCalled) {
            // If a gift card mutation is in flight, tell the cart.
            setIsCartUpdating(applyCardLoading || removeCardLoading);
        }
    }, [
        applyCardCalled,
        applyCardLoading,
        removeCardCalled,
        removeCardLoading,
        setIsCartUpdating
    ]);

    const shouldDisplayCardBalance =
        mostRecentAction === actions.CHECK_BALANCE &&
        Boolean(balanceResult.data);

    // We should only display the last card error if the most recent action was apply or check and they had an error
    const shouldDisplayCardError =
        (mostRecentAction === actions.APPLY && applyCardResult.error) ||
        (mostRecentAction === actions.CHECK_BALANCE && balanceResult.error);

    return {
        applyGiftCard,
        checkBalanceData:
            balanceResult.data && balanceResult.data.giftCardAccount,
        checkGiftCardBalance,
        errorLoadingGiftCards: Boolean(appliedCardsResult.error),
        errorRemovingCard: Boolean(removeCardResult.error),
        giftCardsData:
            (appliedCardsResult.data &&
                appliedCardsResult.data.cart.applied_giftcard) ||
            [],
        isLoadingGiftCards: appliedCardsResult.loading,
        isApplyingCard: applyCardLoading,
        isCheckingBalance: balanceResult.loading,
        isRemovingCard: removeCardLoading,
        removeGiftCard,
        shouldDisplayCardBalance,
        shouldDisplayCardError
    };
};
