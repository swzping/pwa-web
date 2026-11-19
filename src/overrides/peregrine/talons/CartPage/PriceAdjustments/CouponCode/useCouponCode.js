import { useCallback, useEffect, useMemo,useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import DEFAULT_OPERATIONS from './couponCode.gql';
import { useToasts } from '@magento/peregrine';
import {
    buildCouponCodePayload,
    getApplyCouponErrorMessage,
    getCouponMutationErrorMessage,
    getUnavailableCouponResults
} from './couponPayload';

/**
 * This talon contains the logic for a coupon code form component.
 * It performs effects and returns props data for rendering the component.
 *
 * This talon performs the following effects:
 *
 * - Fetch all coupons associated with the cart
 * - Manage the updating state of the cart while a coupon is being applied or removed
 *
 * @function
 *
 * @param {Object} props
 * @param {function} props.setIsCartUpdating Callback function for setting the update state for the cart.
 * @param {CouponCodeMutations} props.mutations GraphQL mutations for a cart's coupon code.
 * @param {CouponCodeQueries} props.queries GraphQL queries for a cart's coupon code.
 *
 * @return {CouponCodeTalonProps}
 *
 * @example <caption>Importing into your project</caption>
 * import { useCouponCode } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/CouponCode/useCouponCode';
 */
export const useCouponCode = props => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const [applyErrorToast, setApplyErrorToast] = useState(null);
    const {
        getAppliedCouponsQuery,
        applyCouponMutation,
        removeCouponMutation,
        applyMultipleCouponMutation,
        removeMultipleCouponMutation
    } = operations;
    const { setIsCartUpdating, dataAppliedCoupon, setLoadingRefetchDataCart = () => {} } = props;

    const [{ cartId }] = useCartContext();
    const { data, error: fetchError, refetch: refetchCart } = useQuery(getAppliedCouponsQuery, {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first',
        skip: !cartId,
        variables: {
            cartId
        }
    });

    // default magento
    // const [
    //     applyCoupon,
    //     {
    //         called: applyCouponCalled,
    //         error: applyError,
    //         loading: applyingCoupon
    //     }
    // ] = useMutation(applyCouponMutation);

    // const [
    //     removeCoupon,
    //     {
    //         called: removeCouponCalled,
    //         error: removeCouponError,
    //         loading: removingCoupon
    //     }
    // ] = useMutation(removeCouponMutation);

    const [
        applyMultipleCoupon,
        {
            called: applyMultipleCouponCalled,
            error: applyMultipleError,
            loading: applyingMultipleCoupon
        }
    ] = useMutation(applyMultipleCouponMutation);

    const [
        removeMultipleCoupon,
        {
            called: removeMultipleCouponCalled,
            error: removeMultipleCouponError,
            loading: removingMultipleCoupon
        }
    ] = useMutation(removeMultipleCouponMutation);

    // default magento
    // const handleApplyCoupon = useCallback(
    //     async ({ couponCode }) => {
    //         if (!couponCode) return;
    //         try {
    //             await applyCoupon({
    //                 variables: {
    //                     cartId,
    //                     couponCode
    //                 }
    //             });
    //         } catch (e) {
    //             // Error is logged by apollo link - no need to double log.
    //         }
    //     },
    //     [applyCoupon, cartId]
    // );

    // default magento
    // const handleRemoveCoupon = useCallback(
    //     async couponCode => {
    //         try {
    //             await removeCoupon({
    //                 variables: {
    //                     cartId,
    //                     couponCode
    //                 }
    //             });
    //         } catch (e) {
    //             // Error is logged by apollo link - no need to double log.
    //         }
    //     },
    //     [cartId, removeCoupon]
    // );

    const [, { addToast }] = useToasts();

    const handleApplyMultipleCoupon = async ({ couponCode, preserveExistingCoupons = true }) => {
        const customerCoupon = buildCouponCodePayload({
            couponCode,
            dataAppliedCoupon,
            preserveExistingCoupons
        });

        if (!couponCode && preserveExistingCoupons) return;
        try {
            const response = await applyMultipleCoupon({
                variables: {
                    cartId,
                    couponCode: customerCoupon
                }
            });
            const applyCouponResults = response.data.applyMultipleCoupon;
            const applyCouponErrorMessage = getApplyCouponErrorMessage(applyCouponResults);
            setApplyErrorToast(applyCouponErrorMessage);

            const unavailableCoupons = getUnavailableCouponResults(applyCouponResults);
            unavailableCoupons.forEach(() => {
                addToast({
                    type: 'info',
                    message: applyCouponErrorMessage,
                    timeout: 3000
                });
            });
        } catch (e) {
            const mutationErrorMessage = getCouponMutationErrorMessage(e);
            setApplyErrorToast(mutationErrorMessage);
            if (mutationErrorMessage) {
                addToast({
                    type: 'info',
                    message: mutationErrorMessage,
                    timeout: 3000
                });
            }
            // Error is logged by apollo link - no need to double log.
        }
        [applyMultipleCoupon, cartId]
    };

    const handleRemoveMultipleCoupon = async (couponCode) => {
        let customerCoupon = [];
        let removeCustomerCoupon = [];
        if (dataAppliedCoupon && couponCode) {
            dataAppliedCoupon.forEach(({ code }) => {
                customerCoupon = code.split(",");
                removeCustomerCoupon = customerCoupon.filter(e => e !== couponCode);
            });
        }
        if (!couponCode) return;
        try {
            await removeMultipleCoupon({
                variables: {
                    cartId,
                    couponCode: removeCustomerCoupon
                }
            });
        } catch (e) {
            // Error is logged by apollo link - no need to double log.
        }
        [cartId, removeMultipleCoupon]
    };

    // default magento
    // useEffect(() => {
    //     if (applyCouponCalled || removeCouponCalled) {
    //         // If a coupon mutation is in flight, tell the cart.
    //         setIsCartUpdating(applyingCoupon || removingCoupon);
    //         refetchCart();
    //     }
    // }, [
    //     applyCouponCalled,
    //     applyingCoupon,
    //     removeCouponCalled,
    //     removingCoupon,
    //     setIsCartUpdating
    // ]);

    useEffect(() => {
        if (applyMultipleCouponCalled || removeMultipleCouponCalled) {
            // If a coupon mutation is in flight, tell the cart.
            setIsCartUpdating(applyingMultipleCoupon || removingMultipleCoupon);
            setLoadingRefetchDataCart(applyMultipleCouponCalled || removeMultipleCouponCalled);
            refetchCart();
        }
    }, [
        applyMultipleCouponCalled,
        applyingMultipleCoupon,
        removeMultipleCouponCalled,
        removingMultipleCoupon,
        setIsCartUpdating
    ]);

    // Create a memoized error map and toggle individual errors when they change
    const errors = useMemo(
        () =>
            new Map([
                ['getAppliedCouponsQuery', fetchError],
                // ['applyCouponMutation', applyError],
                // ['removeCouponMutation', removeCouponError],
                ['applyMultipleCouponMutation', applyMultipleError],
                ['removeMultipleCouponMutation', removeMultipleCouponError],
            ]),
        [fetchError, applyMultipleError, removeMultipleCouponError]
    );

    return {
        data,
        errors,
        handleApplyMultipleCoupon,
        handleRemoveMultipleCoupon,
        applyingMultipleCoupon,
        removingMultipleCoupon,
        applyErrorToast
    };
};

/** JSDocs type definitions */

/**
 * GraphQL mutations for a cart's coupon code.
 * This is a type used by the {@link useCouponCode} talon.
 *
 * @typedef {Object} CouponCodeMutations
 *
 * @property {GraphQLAST} applyCouponMutation Mutation for applying a coupon code to a cart.
 * @property {GraphQLAST} removeCouponMutation Mutation for removing a coupon code from a cart.
 * @property {GraphQLAST} applyMultipleCouponMutation Mutation for applying a coupon code to a cart.
 * @property {GraphQLAST} removeMultipleCouponMutation Mutation for removing a coupon code from a cart.
 *
 * @see [CouponCode.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode/couponCode.js}
 * for the queries used Venia
 */

/**
 * GraphQL queries for a cart's coupon code.
 * This is a type used by the {@link useCouponCode} talon.
 *
 * @typedef {Object} CouponCodeQueries
 *
 * @property {GraphQLAST} getAppliedCouponsQuery Query to fetch the currently applied coupons for a cart.
 *
 * @see [CouponCode.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode/couponCode.js}
 * for the queries used Venia
 */

/**
 * Object type returned by the {@link useCouponCode} talon.
 * It provides props data to use when rendering a coupon code component.
 *
 * @typedef {Object} CouponCodeTalonProps
 *
 * @property {boolean} applyingCoupon True if a coupon is currently being applied. False otherwise.
 * @property {Object} data Data returned from the `getAppliedCouponsQuery`.
 * @property {String} errorMessage If GraphQL error occurs, this value is set.
 * @property {Object} fetchError The error data object returned by a GraphQL query.
 * @property {function} handleApplyCoupon Function to call for handling the application of a coupon code to a cart.
 * @property {function} handleRemoveCoupon Function to call for handling the removal of a coupon code from a cart
 * @property {boolean} removingCoupon True if a coupon code is currently being removed. False otherwise.
 * @property {boolean} applyingMultipleCoupon True if a coupon is currently being applied. False otherwise.
 * @property {function} handleApplyMultipleCoupon Function to call for handling the application of a coupon code to a cart.
 * @property {function} handleRemoveMultipleCoupon Function to call for handling the removal of a coupon code from a cart
 * @property {boolean} removingMultipleCoupon True if a coupon code is currently being removed. False otherwise.
 */
