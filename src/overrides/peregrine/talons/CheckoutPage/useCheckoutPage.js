import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
    gql,
    useApolloClient,
    useMutation,
    useLazyQuery,
    useQuery
} from '@apollo/client';
import { useHistory } from 'react-router-dom';
// import { clearCartDataFromCache } from '@magento/peregrine/lib/Apollo/clearCartDataFromCache';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/checkoutPage.gql.js';

import CheckoutError from '@magento/peregrine/lib/talons/CheckoutPage/CheckoutError';
import {
    consumeFromCartFlag,
    peekFromCartFlag
} from '@/helpers/cartAutoApplyVoucher';
import { trackProductSubmitOrder } from '@/utils/track';

import { useMidtrans } from '../../../../modules/peregrine/talons/Midtrans/useMidtrans';

import { forceRefreshToken } from '../../../../lib/customerSessionToken'
import {
    checkoutTracking,
    checkoutOptionTracking,
    purchaseTracking,
    checkoutBeginTracking,
    checkoutShippingTracking,
    checkoutPaymentTracking
} from '../../../../lib/ThirdPartyTracking';

export const CHECKOUT_STEP = {
    SHIPPING_ADDRESS: 1,
    SHIPPING_METHOD: 2,
    PAYMENT: 3,
    REVIEW: 4
};

/**
 * Resets the cart's auto-applied voucher state. Must run BEFORE any other
 * cart request on the checkout page so the returned cart data reflects the
 * reset state. The mutation result (`success`) is not used here; cart data
 * is always refetched afterwards by the page's own queries.
 */
const RESET_AUTO_APPLY_VOUCHER = gql`
    mutation ResetAutoApplyVoucher($cartId: String!) {
        resetAutoApplyVoucher(input: { cart_id: $cartId }) {
            success
        }
    }
`;

/**
 *
 * @param {DocumentNode} props.operations.getCheckoutDetailsQuery query to fetch checkout details
 * @param {DocumentNode} props.operations.getCustomerQuery query to fetch customer details
 * @param {DocumentNode} props.operations.getOrderDetailsQuery query to fetch order details
 * @param {DocumentNode} props.operations.createCartMutation mutation to create a new cart
 * @param {DocumentNode} props.operations.placeOrderMutation mutation to place order
 *
 * @returns {
 *  activeContent: String,
 *  availablePaymentMethods: Array,
 *  cartItems: Array,
 *  checkoutStep: Number,
 *  customer: Object,
 *  error: ApolloError,
 *  handlePlaceOrder: Function,
 *  hasError: Boolean,
 *  isCartEmpty: Boolean,
 *  isGuestCheckout: Boolean,
 *  isResettingAutoVoucher: Boolean,
 *  isLoading: Boolean,
 *  isUpdating: Boolean,
 *  orderDetailsData: Object,
 *  orderDetailsLoading: Boolean,
 *  orderNumber: String,
 *  placeOrderLoading: Boolean,
 *  setCheckoutStep: Function,
 *  setIsUpdating: Function,
 *  setShippingInformationDone: Function,
 *  setShippingMethodDone: Function,
 *  setPaymentInformationDone: Function,
 *  scrollShippingInformationIntoView: Function,
 *  shippingInformationRef: ReactRef,
 *  shippingMethodRef: ReactRef,
 *  scrollShippingMethodIntoView: Function,
 *  resetReviewOrderButtonClicked: Function,
 *  handleReviewOrder: Function,
 *  reviewOrderButtonClicked: Boolean,
 *  toggleAddressBookContent: Function,
 *  toggleSignInContent: Function,
 * }
 */
export const useCheckoutPage = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const history = useHistory();
    const {
        handleGetSnapToken,
        placeOrder,
        placeOrderData,
        placeOrderError,
        placeOrderLoading
    } = useMidtrans();

    const {
        createCartMutation,
        getCheckoutDetailsQuery,
        getCustomerQuery,
        getOrderDetailsQuery
        // placeOrderMutation
    } = operations;

    const [reviewOrderButtonClicked, setReviewOrderButtonClicked] = useState(
        false
    );

    const shippingInformationRef = useRef();
    const shippingMethodRef = useRef();

    const apolloClient = useApolloClient();
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeContent, setActiveContent] = useState('checkout');
    const [checkoutStep, setCheckoutStep] = useState(
        CHECKOUT_STEP.SHIPPING_ADDRESS
    );
    const [{ isSignedIn }] = useUserContext();
    const [{ cartId }, { createCart, removeCart }] = useCartContext();

    const [fetchCartId] = useMutation(createCartMutation);
    const [resetAutoApplyVoucher] = useMutation(RESET_AUTO_APPLY_VOUCHER);

    // Whether the auto-apply voucher reset must finish before checkout cart
    // data loads. Initialized during the FIRST render (flag is only peeked,
    // not consumed) so the page can block all cart data queries via shimmer
    // until the reset resolves. Guests and "directly from the cart page"
    // entries start as false and load immediately.
    const [isResettingAutoVoucher, setIsResettingAutoVoucher] = useState(
        () => isSignedIn && !peekFromCartFlag()
    );
    // const [
    //     placeOrder,
    //     {
    //         data: placeOrderData,
    //         error: placeOrderError,
    //         loading: placeOrderLoading
    //     }
    // ] = useMutation(placeOrderMutation);

    const [
        getOrderDetails,
        { data: orderDetailsData, loading: orderDetailsLoading }
    ] = useLazyQuery(getOrderDetailsQuery, {
        // We use this query to fetch details _just_ before submission, so we
        // want to make sure it is fresh. We also don't want to cache this data
        // because it may contain PII.
        fetchPolicy: 'no-cache'
    });

    const { data: customerData, loading: customerLoading } = useQuery(
        getCustomerQuery,
        { skip: !isSignedIn }
    );

    const {
        data: checkoutData,
        networkStatus: checkoutQueryNetworkStatus,
        loading: checkoutDataLoading
    } = useQuery(getCheckoutDetailsQuery, {
        /**
         * Skip fetching checkout details if the `cartId`
         * is a falsy value, or while the auto-apply voucher reset is
         * pending (the reset must complete first so the response
         * reflects the reset state).
         */
        skip: !cartId || isResettingAutoVoucher,
        notifyOnNetworkStatusChange: true,
        variables: {
            cartId
        }
    });

    const cartItems = useMemo(() => {
        return (checkoutData && checkoutData.cart.items) || [];
    }, [checkoutData]);

    /**
     * For more info about network statues check this out
     *
     * https://www.apollographql.com/docs/react/data/queries/#inspecting-loading-states
     */
    const isLoading = useMemo(() => {
        const checkoutQueryInFlight = checkoutQueryNetworkStatus
            ? checkoutQueryNetworkStatus < 7
            : true;

        // While the auto-apply voucher reset is pending the checkout details
        // query is skipped, which reports networkStatus 7 (ready); the reset
        // flag must hold the page's loading state on its own.
        return (
            isResettingAutoVoucher || checkoutQueryInFlight || customerLoading
        );
    }, [isResettingAutoVoucher, checkoutQueryNetworkStatus, customerLoading]);

    // Runs once per mount as soon as `isSignedIn` and `cartId` are both
    // ready: consume the one-shot "entered from the cart page" flag and, if
    // it is not set, run resetAutoApplyVoucher before the cart queries
    // unblock. Errors are intentionally ignored - a failed reset must never
    // block the checkout page from loading its data.
    const hasConsumedFromCartRef = useRef(false);
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            const fromCart = consumeFromCartFlag();
            hasConsumedFromCartRef.current = true;

            if (fromCart) {
                // Entered directly from the cart page: the cart page already
                // reset. The initial render may have blocked the queries
                // (the flag was only peeked), so always settle the state.
                setIsResettingAutoVoucher(false);
                return;
            }

            setIsResettingAutoVoucher(true);
            try {
                await resetAutoApplyVoucher({ variables: { cartId } });
            } catch (error) {
                // Intentionally ignored.
            } finally {
                if (!cancelled) {
                    setIsResettingAutoVoucher(false);
                }
            }
        };

        // An expired token can flip `isSignedIn` to false after it was
        // initialized `true` from storage: settle the state so the page is
        // not blocked behind the shimmer forever.
        if (!isSignedIn) {
            setIsResettingAutoVoucher(false);
            return;
        }

        // The ref is armed only after the guard passes so a late-arriving
        // `cartId` (e.g. page refresh directly on /checkout) still triggers
        // the reset once it is available.
        if (cartId && !hasConsumedFromCartRef.current) {
            run();
        }

        return () => {
            cancelled = true;
        };
    }, [cartId, isSignedIn, resetAutoApplyVoucher]);

    const customer = customerData && customerData.customer;

    const toggleAddressBookContent = useCallback(() => {
        setActiveContent(currentlyActive =>
            currentlyActive === 'checkout' ? 'addressBook' : 'checkout'
        );
    }, []);
    const toggleSignInContent = useCallback(() => {
        setActiveContent(currentlyActive =>
            currentlyActive === 'checkout' ? 'signIn' : 'checkout'
        );
    }, []);

    const checkoutError = useMemo(() => {
        if (placeOrderError) {
            return new CheckoutError(placeOrderError);
        }
    }, [placeOrderError]);

    const handleReviewOrder = useCallback(() => {
        setReviewOrderButtonClicked(true);
    }, []);

    const resetReviewOrderButtonClicked = useCallback(() => {
        setReviewOrderButtonClicked(false);
    }, []);

    const scrollShippingInformationIntoView = useCallback(() => {
        if (shippingInformationRef.current) {
            shippingInformationRef.current.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }, [shippingInformationRef]);

    const setShippingInformationDone = useCallback(
        shippingData => {
            if (checkoutStep === CHECKOUT_STEP.SHIPPING_ADDRESS) {
                setCheckoutStep(CHECKOUT_STEP.SHIPPING_METHOD);

                const trackingActionField = {
                    step: CHECKOUT_STEP.SHIPPING_ADDRESS,
                    option: `${shippingData.firstname} ${
                        shippingData.lastname
                    }. ${shippingData.street[0]}, ${shippingData.city}, ${
                        shippingData.region.region
                    }. ${shippingData.postcode}. ${shippingData.telephone}.`
                };
                checkoutTracking(cartItems, 'IDR', trackingActionField);

                checkoutOptionTracking('IDR', {...trackingActionField, action: 'checkoutOption'});

                checkoutBeginTracking(checkoutData && checkoutData.cart);
            }
        },
        [checkoutStep, checkoutDataLoading]
    );

    const scrollShippingMethodIntoView = useCallback(() => {
        if (shippingMethodRef.current) {
            shippingMethodRef.current.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }, [shippingMethodRef]);

    const setShippingMethodDone = useCallback(
        derivedSelectedShippingMethod => {
            if (checkoutStep === CHECKOUT_STEP.SHIPPING_METHOD) {
                setCheckoutStep(CHECKOUT_STEP.PAYMENT);

                const trackingActionField = {
                    step: CHECKOUT_STEP.SHIPPING_METHOD,
                    option:
                        (derivedSelectedShippingMethod &&
                            derivedSelectedShippingMethod.method_title) ||
                        'Pickup at Store' //should display selected shipping method name
                };
                checkoutTracking(cartItems, 'IDR', trackingActionField);

                checkoutOptionTracking('IDR', {...trackingActionField, action: 'checkoutOption'});
            }

            if (checkoutStep === CHECKOUT_STEP.REVIEW) {
                const trackingActionField = {
                    step: CHECKOUT_STEP.SHIPPING_METHOD,
                    option:
                        (derivedSelectedShippingMethod &&
                            derivedSelectedShippingMethod.method_title) ||
                        'Pickup at Store' //should display selected shipping method name
                };
                checkoutShippingTracking(cartItems, 'IDR', trackingActionField);
            }
        },
        [checkoutStep]
    );

    const setPaymentInformationDone = useCallback(
        selectedPaymentMethod => {
            if (checkoutStep === CHECKOUT_STEP.PAYMENT) {
                globalThis.scrollTo({
                    left: 0,
                    top: 0,
                    behavior: 'smooth'
                });
                setCheckoutStep(CHECKOUT_STEP.REVIEW);

                const trackingActionField = {
                    step: CHECKOUT_STEP.PAYMENT,
                    option: selectedPaymentMethod
                };
                checkoutTracking(cartItems, 'IDR', trackingActionField);

                checkoutOptionTracking('IDR', {...trackingActionField, action: 'checkoutOption'});
                checkoutPaymentTracking(cartItems, 'IDR', trackingActionField);
            }
        },
        [checkoutStep]
    );

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const handlePlaceOrder = useCallback(async () => {
        // Refresh token
        forceRefreshToken()
        // Fetch order details and then use an effect to actually place the
        // order. If/when Apollo returns promises for invokers from useLazyQuery
        // we can just await this function and then perform the rest of order
        // placement.
        await getOrderDetails({
            variables: {
                cartId
            }
        });
        setIsPlacingOrder(true);
    }, [cartId, getOrderDetails]);

    // Go back to checkout if shopper logs in
    useEffect(() => {
        if (isSignedIn) {
            setActiveContent('checkout');
        }
    }, [isSignedIn]);

    useEffect(() => {
        async function placeOrderAndCleanup() {
            try {
                const result = await placeOrder({
                    variables: {
                        cartId
                    }
                });

                const orderNumber = result.data.placeOrder.order.order_number;

                const selectedPaymentMethod =
                    orderDetailsData.cart.selected_payment_method.code;

                if (selectedPaymentMethod.match(/snap.*/)) {
                    handleGetSnapToken(orderNumber);
                } else {
                    await removeCart();
                    history.push(`/thanks/order?number=${orderNumber}`);
                }
                trackProductSubmitOrder(orderNumber, orderDetailsData)

                let tax = 0;
                orderDetailsData.cart.prices.applied_taxes &&
                    orderDetailsData.cart.prices.applied_taxes.forEach(
                        applied => {
                            if (applied.amount && applied.amount.value) {
                                tax += applied.amount.value;
                            }
                        }
                    );
                let shippingCost = 0;
                if (orderDetailsData.cart.shipping_addresses.length > 0) {
                    shippingCost =
                        orderDetailsData.cart.shipping_addresses[0]
                            .selected_shipping_method.amount.value;
                }
                const total = orderDetailsData.cart.prices.grand_total.value;
                purchaseTracking(
                    orderNumber,
                    total,
                    tax,
                    shippingCost,
                    orderDetailsData.cart.items,
                    orderDetailsData
                );

                // Cleanup stale cart and customer info.
                // await removeCart();
                // await clearCartDataFromCache(apolloClient);

                await createCart({
                    fetchCartId
                });
            } catch (err) {
                console.error(
                    'An error occurred during when placing the order',
                    err
                );
                setReviewOrderButtonClicked(false);
                setCheckoutStep(CHECKOUT_STEP.PAYMENT);
            }
        }

        if (orderDetailsData && isPlacingOrder) {
            setIsPlacingOrder(false);
            placeOrderAndCleanup();
        }
    }, [
        apolloClient,
        cartId,
        createCart,
        fetchCartId,
        orderDetailsData,
        placeOrder,
        isPlacingOrder
    ]);

    return {
        activeContent,
        availablePaymentMethods: checkoutData
            ? checkoutData.cart.available_payment_methods
            : null,
        cartItems,
        checkoutStep,
        customer,
        error: checkoutError,
        handlePlaceOrder,
        hasError: !!checkoutError,
        isCartEmpty: !(checkoutData && checkoutData.cart?.total_quantity),
        isGuestCheckout: !isSignedIn,
        isResettingAutoVoucher,
        isLoading,
        isUpdating,
        orderDetailsData,
        orderDetailsLoading,
        orderNumber:
            (placeOrderData && placeOrderData.placeOrder.order.order_number) ||
            null,
        placeOrderLoading,
        setCheckoutStep,
        setIsUpdating,
        setShippingInformationDone,
        setShippingMethodDone,
        setPaymentInformationDone,
        scrollShippingInformationIntoView,
        shippingInformationRef,
        shippingMethodRef,
        scrollShippingMethodIntoView,
        resetReviewOrderButtonClicked,
        handleReviewOrder,
        reviewOrderButtonClicked,
        toggleAddressBookContent,
        toggleSignInContent
    };
};
