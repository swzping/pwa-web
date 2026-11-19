import React, { Fragment, useEffect, useContext, useState, useRef } from 'react';
import { shape, string } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { AlertCircle as AlertCircleIcon } from 'react-feather';
import { Link, useHistory } from 'react-router-dom';
import Select from 'react-select';

import { useWindowSize, useToasts } from '@magento/peregrine';
import {
    CHECKOUT_STEP,
    useCheckoutPage
} from '@magento/peregrine/lib/talons/CheckoutPage/useCheckoutPage';
import { useMidtrans } from '../../../../modules/peregrine/talons/Midtrans/useMidtrans';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import Icon from '@magento/venia-ui/lib/components/Icon';
import StockStatusMessage from '@magento/venia-ui/lib/components/StockStatusMessage';
import FormError from '@magento/venia-ui/lib/components/FormError';
import AddressBook from '@magento/venia-ui/lib/components/CheckoutPage/AddressBook';
import GuestSignIn from '@magento/venia-ui/lib/components/CheckoutPage/GuestSignIn';
import OrderSummary from '@magento/venia-ui/lib/components/CheckoutPage/OrderSummary';
import PaymentInformation from '@magento/venia-ui/lib/components/CheckoutPage/PaymentInformation';
import payments from '@magento/venia-ui/lib/components/CheckoutPage/PaymentInformation/paymentMethodCollection';
import PriceAdjustments from '@magento/venia-ui/lib/components/CheckoutPage/PriceAdjustments';
import ShippingMethod from '@magento/venia-ui/lib/components/CheckoutPage/ShippingMethod';
import ShippingInformation from '@magento/venia-ui/lib/components/CheckoutPage/ShippingInformation';
// import OrderConfirmationPage from '@magento/venia-ui/lib/components/CheckoutPage/OrderConfirmationPage';
// import ItemsReview from './ItemsReview';
import PriceSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary';
import defaultClasses from './checkoutPage.module.css';
import ScrollAnchor from '@magento/venia-ui/lib/components/ScrollAnchor/scrollAnchor';

import HeadMitrans from '../../../../modules/swift-pwa-ui/components/Midtrans';
import { HeaderContext } from '../../../peregrine/context/header';
import CheckoutPageShimmer from './checkoutPage.shimmer';
import VerifyEmailModal from './VerifyEmail/verifyEmailModal'
import VerifyEmailCodeModal from './VerifyEmail/verifyEmailCodeModal'
import StorePickup from './storePickup';
import SIGN_DEFAULT_OPERATIONS from '../../../../overrides/peregrine/talons/SignIn/signIn.gql'

import { useAllowGuestCheckout } from '../../../../modules/peregrine/talons/AllowGuestCheckout/useAllowGuestCheckout';
import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { GET_APOTIK_LOCATION, SET_STORE_LOCATION } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingInformation/shippingInformation.gql';
import { GET_AVAILABLE_SHIPPING_METHODS } from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/shippingMethod.gql';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CartPage/PriceSummary/priceSummary.gql';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import './checkoutPage.css'
import PointsPop from '../../../venia-ui/components/Header/components/MyPoints/PointsPop';
import PointsDrawer from './PointsDrawer';
import EventPreview from './EventPreview';
import PurchasedItemsTableList from '../../../../modules/swift-pwa-ui/components/CheckoutPage/PurchasedItemsTableList';
import { markFromCheckout } from '@/helpers/cartAutoApplyVoucher';

const errorIcon = <Icon src={AlertCircleIcon} size={20} />;

const CheckoutPage = props => {
    const { classes: propClasses } = props;
    const { formatMessage } = useIntl();
    const [isPointsDrawerOpen, setIsPointsDrawerOpen] = useState(false);
    const [selectedPoints, setSelectedPoints] = useState(null);
    const [paymentInformationRefreshKey, setPaymentInformationRefreshKey] = useState(0);
    // 追踪用户是否手动取消了积分，防止回调函数重新设置
    const isPointsManuallyCleared = useRef(false);
    const [detailSummary, setDetailSummary] = useState(false);
    const [loadingRefetchDataCart, setLoadingRefetchDataCart] = useState(false);
    const talonProps = useCheckoutPage();
    const { isResettingAutoVoucher } = talonProps;
    const { setNavConfig } = useContext(HeaderContext);

    const [selectedMethod, setSelectedMethod] = useState('home');
    const { data: dataApotik } = useQuery(GET_APOTIK_LOCATION);

    const { getPriceSummaryQuery } = DEFAULT_OPERATIONS;

    const [{ cartId }] = useCartContext();
    const { data, refetch } = useQuery(
        GET_AVAILABLE_SHIPPING_METHODS,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            // Hooks run before the page's shimmer early-return, so the
            // auto-apply voucher reset must be gated here explicitly.
            skip: !cartId || isResettingAutoVoucher,
            variables: { cartId }
        }
    );

    const GET_POINT_BALANCE = gql`
        query GetPointBalance {
            getBalancePoint {
                success
                code
                message
                data {
                    point
                }
            }
        }
    `;

    const UPDATE_POINTS_IN_CART = gql`
        mutation UpdatePointsInCart($cartId: String!, $points: Int!) {
            updatePointsInCart(
                cart_id: $cartId
                points: $points
            ) {
                success
                message
                applied_points
            }
        }
    `;

    const { data: pointBalanceData, refetch: pointBalanceRefetch } = useQuery(GET_POINT_BALANCE, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const [updatePointsInCart] = useMutation(UPDATE_POINTS_IN_CART);
    const redeemPointsBalance = pointBalanceData?.getBalancePoint?.data?.point || 0;

    const { data: customerInformationData, refetch: customerInformationRefetch } = useQuery(
        SIGN_DEFAULT_OPERATIONS.getCustomerInformation,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            skip: !cartId,
        }
    )

    const [getPriceSummary] = useLazyQuery(
        getPriceSummaryQuery,
        {
            fetchPolicy: 'network-only',
            skip: !cartId,
            variables: { cartId }
        }
    );

    const [selectApotik, setSelectApotik] = useState('');
    const [email, setEmail] = useState('')
    const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false)
    const [isVerifyEmailCodeModalOpen, setIsVerifyEmailCodeModalOpen] = useState(false)

    const handleselectApotik = (event) => {
        setSelectApotik(event.value);
        setIsUpdating(true);
    };

    const apotikList = dataApotik?.CustomLocationStore?.map(v => ({
        value: v.loc_code,
        label: v.loc_name,
        isDisabled: v.loc_code !== "AG0001"
    }))

    useEffect(() => {
        // While the auto-apply voucher reset is pending, hold off selecting
        // the default store: it would trigger the cart write below inside
        // the reset window.
        if (isResettingAutoVoucher) return;
        const loc_code = dataApotik?.CustomLocationStore?.[0]?.loc_code
        if (loc_code) {
            setSelectApotik(loc_code);
        }
    }, [dataApotik, isResettingAutoVoucher])

    useEffect(async () => {
        // The store-location mutation, the shipping-methods refetch() and
        // the price summary lazy query below are cart traffic; defer them
        // until the auto-apply voucher reset has finished.
        if (isResettingAutoVoucher) return;
        if (selectApotik) {
            const getStoreAddress = dataApotik && dataApotik.CustomLocationStore.find(e => e.loc_code === selectApotik);
            try {
                await setStoreLocation({
                    variables: {
                        cartId,
                        loc_code: selectApotik,
                        store_address: getStoreAddress.loc_street
                    }
                });
                setIsUpdating(false);
                refetch();
                getPriceSummary();
                sessionStorage.setItem('getSelectStoreAddress', JSON.stringify(getStoreAddress || {}));
            } catch (error) {
                console.error(error);
            }
        }
    }, [selectApotik, isResettingAutoVoucher]);

    const isPickup =
        data &&
        data.cart &&
        data.cart.shipping_addresses[0] &&
        data.cart.shipping_addresses[0].available_shipping_methods.find(e => e.method_code === "pickup");

    const [
        setStoreLocation,
        { loading: setStoreLocationLoading }
    ] = useMutation(SET_STORE_LOCATION);
    const {
        /**
         * Enum, one of:
         * SHIPPING_ADDRESS, SHIPPING_METHOD, PAYMENT, REVIEW
         */
        activeContent,
        availablePaymentMethods,
        cartItems,
        checkoutStep,
        customer,
        error,
        handlePlaceOrder,
        hasError,
        isCartEmpty,
        isGuestCheckout,
        isLoading,
        isUpdating,
        orderDetailsData,
        orderDetailsLoading,
        orderNumber,
        placeOrderLoading,
        setCheckoutStep,
        setIsUpdating,
        setShippingInformationDone,
        scrollShippingInformationIntoView,
        setShippingMethodDone,
        scrollShippingMethodIntoView,
        setPaymentInformationDone,
        shippingInformationRef,
        shippingMethodRef,
        resetReviewOrderButtonClicked,
        handleReviewOrder,
        reviewOrderButtonClicked,
        toggleAddressBookContent,
        toggleSignInContent
    } = talonProps;

    // 从 checkoutData 中获取 total_quantity
    const totalQuantity = talonProps.checkoutData?.cart?.total_quantity || 0;

    const history = useHistory();
    const { snapClientLoading } = useMidtrans();

    const showSummaryButton = () => {
        setDetailSummary(!detailSummary);
    };

    const [, { addToast }] = useToasts();

    const { isAllowGuestCheckout, isLoadingAllowGuestCheckout, isAllowCustomerGroup } = useAllowGuestCheckout();

    useEffect(() => {
        if (hasError) {
            const message =
                error && error.message
                    ? error.message
                    : formatMessage({
                        id: 'checkoutPage.errorSubmit',
                        defaultMessage:
                            'Oops! An error occurred while submitting. Please try again.'
                    });
            addToast({
                type: 'error',
                icon: errorIcon,
                message,
                dismissable: true,
                timeout: 7000
            });

            if (process.env.NODE_ENV !== 'production') {
                console.error(error);
            }
        }
    }, [addToast, error, formatMessage, hasError]);

    useEffect(() => {
        setNavConfig({
            headerTitle: formatMessage({
                id: 'checkoutPage.titleCheckout',
                defaultMessage: 'Pesanan'
            }),
            useCart: false,
            borderBottom: true
        });

    }, []);

    // Mark that the checkout was left for the cart page. The CartPage or the
    // MiniCart drawer consumes this one-shot flag and skips the auto-apply
    // voucher reset for that first cart-context entry. Leaving the checkout
    // for any other page (homepage, product page, ...) must NOT leave an
    // exemption behind: the next cart entry resets as usual. The checkout
    // page itself never calls the resetAutoApplyVoucher mutation.
    // In react-router v5 the cleanup already sees the destination route in
    // window.location.
    useEffect(
        () => () => {
            if (window.location.pathname.startsWith('/cart')) {
                markFromCheckout();
            }
        },
        []
    );

    // Entering this page is a full page load (`window.location.href`), so
    // leaving via the browser back button or a refresh unloads the document
    // and the unmount cleanup above never runs. Mirror the mark on pagehide
    // so a back-navigation to the cart page still skips its auto-apply
    // voucher reset. Trade-off: a full-page exit to a NON-cart page also
    // leaves the flag behind, so the next cart entry may skip the reset
    // once. Client-side exits (react-router navigations) don't fire
    // pagehide and keep the exact destination check above.
    useEffect(() => {
        const handlePageHide = () => {
            markFromCheckout();
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => {
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, []);

    // redirect to homepage if !isAllowGuestCheckout && isGuestCheckout
    useEffect(() => {
        if (
            isGuestCheckout
            && (!snapClientLoading && !isLoading && !isLoadingAllowGuestCheckout)
            && !isAllowGuestCheckout
        ) {
            setTimeout(() => { history.push('/'); }, 1000);
        }
        // temporarily testing whitelist production
        // if (isAllowCustomerGroup === true) {
        //     setTimeout(() => { history.push('/'); }, 1000);
        // }
    }, [isGuestCheckout, snapClientLoading, isLoading, isAllowGuestCheckout, isLoadingAllowGuestCheckout, isAllowCustomerGroup]);

    const classes = useStyle(defaultClasses, propClasses);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 961;

    let checkoutContent;

    const heading = isGuestCheckout
        ? formatMessage({
            id: 'checkoutPage.guestCheckout',
            defaultMessage: 'Guest Checkout'
        })
        : formatMessage({
            id: 'checkoutPage.checkout',
            defaultMessage: 'Checkout'
        });

    const handleReviewOrderConfirm = async () => {
        if (!customerInformationData?.customer?.customer_email) {
            await customerInformationRefetch()
        }

        if (!customerInformationData?.customer?.customer_email) {
            setIsVerifyEmailModalOpen(true)
        } else {
            // Submit selected points to cart before reviewing order
            if (selectedPoints !== null && cartId) {
                const isPointsUpdated = await applyPointsToCart(selectedPoints);
                if (!isPointsUpdated) {
                    return;
                }
            }
            handleReviewOrder()
        }
    }
    const handleVerifyEmailConfirm = (email) => {
        setEmail(email)
        setIsVerifyEmailModalOpen(false)
        setIsVerifyEmailCodeModalOpen(true)
    }

    const handleVerifyEmailCodeConfirm = () => {
        setIsVerifyEmailCodeModalOpen(false)
        // handleReviewOrder()
        window.location.reload();
    }

    const formatPoints = value => {
        const stringValue = String(value != null ? value : '');
        const isNegative = stringValue.trim().startsWith('-');
        const raw = stringValue.replace(/[^0-9]/g, '');
        if (raw === '') return '0.00';
        const formatted = `${Number(raw).toLocaleString()}.00`
        return isNegative ? `-${formatted}` : formatted;
    };

    const refreshPaymentInformation = () => {
        setPaymentInformationRefreshKey(key => key + 1);
    };

    const refreshCheckoutPricing = async () => {
        if (!cartId) return;

        setLoadingRefetchDataCart(true);
        try {
            await getPriceSummary();
        } finally {
            setLoadingRefetchDataCart(false);
        }
    };

    const applyPointsToCart = async points => {
        if (!cartId) return;

        try {
            setIsUpdating(true);
            await updatePointsInCart({
                variables: { cartId, points }
            });
            getPriceSummary();
            await pointBalanceRefetch?.();
            refreshPaymentInformation();
            return true;
        } catch (error) {
            console.error('Failed to update points:', error);
            addToast({
                type: 'error',
                message: error?.message || 'Failed to update points',
                dismissable: true,
                timeout: 7000
            });
            return false;
        } finally {
            setIsUpdating(false);
        }
    };



    if (snapClientLoading || isLoading) {
        return (
            <CheckoutPageShimmer items={Array.from({ length: 4 }).fill(null)} />
        );
    } else if (isCartEmpty) {
        checkoutContent = (
            <div className={classes.empty_cart_container}>
                <div className={classes.heading_container}>
                    <div className={classes.heading}>{heading}</div>
                </div>
                <h3>
                    <FormattedMessage
                        id={'checkoutPage.emptyMessage'}
                        defaultMessage={'There are no items in your cart.'}
                    />
                </h3>
            </div>
        );
    } else {
        const signInContainerElement = isGuestCheckout ? (
            <div className={classes.signInContainer}>
                <span className={classes.signInLabel}>
                    <FormattedMessage
                        id={'checkoutPage.signInLabel2'}
                        defaultMessage={'Sign in for Express Checkout'}
                    />
                </span>
                <Button
                    className={classes.signInButton}
                    onClick={toggleSignInContent}
                    priority="normal"
                >
                    <FormattedMessage
                        id={'checkoutPage.signInButton'}
                        defaultMessage={'Sign In'}
                    />
                </Button>
            </div>
        ) : null;

        const shippingMethodSection =
            checkoutStep >= CHECKOUT_STEP.SHIPPING_METHOD ? (
                <ShippingMethod
                    pageIsUpdating={isUpdating}
                    onSave={setShippingMethodDone}
                    onSuccess={scrollShippingMethodIntoView}
                    setPageIsUpdating={setIsUpdating}
                    selectedMethod={selectedMethod}
                    refetch={refetch}
                />
            ) : (
                <div className={classes.stepper_heading}>
                    <h3 className={classes.shipping_method_heading}>
                        <FormattedMessage
                            id={'checkoutPage.shippingMethodStep1'}
                            defaultMessage={'Shipping Method'}
                        />
                    </h3>
                    <span className={classes.shipping_method_subtitle}>
                        <FormattedMessage
                            id={'checkoutPage.shippingMethodStepSubtitle'}
                            defaultMessage={
                                'No delivery available for the selected address'
                            }
                        />
                    </span>
                </div>
            );

        const formErrors = [];
        const paymentMethods = Object.keys(payments);

        // If we have an implementation, or if this is a "zero" checkout,
        // we can allow checkout to proceed.
        const isPaymentAvailable = !!availablePaymentMethods.find(
            ({ code }) => code === 'free' || paymentMethods.includes(code)
        );

        if (!isPaymentAvailable) {
            formErrors.push(
                new Error(
                    formatMessage({
                        id: 'checkoutPage.noPaymentAvailable',
                        defaultMessage: 'Payment is currently unavailable.'
                    })
                )
            );
        }

        const paymentInformationSection =
            checkoutStep >= CHECKOUT_STEP.PAYMENT ? (
                <>
                    {/* <div className="mb-4"> */}
                    <div className={classes.payment_information_heading}>
                        <FormattedMessage
                            id={'checkoutPage.paymentInformationStep1'}
                            defaultMessage={'Payment Information'}
                        />
                    </div>
                    {/* <span className={classes.payment_information_subtitle}>
                            <FormattedMessage
                                id={'checkoutPage.shippingMethodStepSubtitle'}
                                defaultMessage={'Choose payment method'}
                            />
                        </span> */}
                    {/* </div> */}
                    <PaymentInformation
                        onSave={setPaymentInformationDone}
                        checkoutError={error}
                        resetShouldSubmit={resetReviewOrderButtonClicked}
                        setCheckoutStep={setCheckoutStep}
                        shouldSubmit={reviewOrderButtonClicked}
                        setIsUpdating={setIsUpdating}
                        refreshKey={paymentInformationRefreshKey}
                    />
                </>
            ) : (
                <div className={classes.stepper_heading}>
                    <h3 className={classes.payment_information_heading}>
                        <FormattedMessage
                            id={'checkoutPage.paymentInformationStep1'}
                            defaultMessage={'Payment Information'}
                        />
                    </h3>
                    <span className={classes.payment_information_subtitle}>
                        <FormattedMessage
                            id={'checkoutPage.shippingMethodStepSubtitle'}
                            defaultMessage={
                                'No payment available for the selected address'
                            }
                        />
                    </span>
                </div>
            );

        const priceAdjustmentsSection =
            checkoutStep === CHECKOUT_STEP.PAYMENT ? (
                <div className={classes.price_adjustments_container}>
                    <PriceAdjustments
                        setPageIsUpdating={setIsUpdating}
                        setLoadingRefetchDataCart={setLoadingRefetchDataCart}
                        loadingRefetchDataCart={loadingRefetchDataCart}
                        onCouponApplied={refreshCheckoutPricing}
                        onCouponAppliedRefreshPayment={refreshPaymentInformation}
                    />
                </div>
            ) : null;

    const handleLoyaltyPointsLoaded = pointsData => {
        const appliedPoints =
            pointsData && typeof pointsData === 'object'
                ? pointsData.appliedPoints
                : pointsData;
        const normalizedPoints = Number(appliedPoints) || 0;
        // 只有当用户没有手动取消积分时，才自动设置
        if (!isPointsManuallyCleared.current && selectedPoints === null && normalizedPoints) {
            setSelectedPoints(normalizedPoints);
        }
    };

    const priceSummaryMobile = isMobile ? (
            <div>
                <PriceSummary
                    showItems={true}
                    isUpdating={isUpdating}
                    loadingRefetchDataCart={loadingRefetchDataCart}
                    selectedPoints={selectedPoints}
                    onLoyaltyPointsLoaded={handleLoyaltyPointsLoaded}
                    buttonCheckout={
                        checkoutStep === CHECKOUT_STEP.PAYMENT ? (
                            <div className={classes.checkoutButton_container}>
                                <Button
                                    priority={'high'}
                                    onClick={handleReviewOrderConfirm}
                                    className={classes.buttonCheckout}
                                    loading={reviewOrderButtonClicked}
                                    disabled={
                                        reviewOrderButtonClicked ||
                                        isUpdating ||
                                        !isPaymentAvailable || !selectApotik
                                    }
                                >
                                    <FormattedMessage
                                        id={'checkoutPage.reviewOrder'}
                                        defaultMessage={'Review Order'}
                                    />
                                </Button>
                            </div>
                        ) : null || checkoutStep === CHECKOUT_STEP.REVIEW ? (
                            <div className={classes.checkoutButton_container}>
                                <Button
                                    priority={'high'}
                                    onClick={handlePlaceOrder}
                                    className={classes.buttonCheckout}
                                    loading={
                                        isUpdating ||
                                        placeOrderLoading ||
                                        orderDetailsLoading
                                    }
                                    disabled={
                                        isUpdating ||
                                        placeOrderLoading ||
                                        orderDetailsLoading || !selectApotik
                                    }
                                >
                                    <FormattedMessage
                                        id={'checkoutPage.placeOrder'}
                                        defaultMessage={'Place Order'}
                                    />
                                </Button>
                            </div>
                        ) : null
                    }
                />
            </div>
        ) : null;

        const reviewOrderButton =
            checkoutStep === CHECKOUT_STEP.PAYMENT ? (
                <Button
                    onClick={handleReviewOrderConfirm}
                    priority="high"
                    className={classes.review_order_button}
                    loading={reviewOrderButtonClicked}
                    disabled={
                        reviewOrderButtonClicked ||
                        isUpdating ||
                        !isPaymentAvailable || !selectApotik
                    }
                >
                    <FormattedMessage
                        id={'checkoutPage.reviewOrder'}
                        defaultMessage={'Review Order'}
                    />
                </Button>
            ) : null;

        // const itemsReview =
        //     checkoutStep === CHECKOUT_STEP.REVIEW ? (
        //         <div className={classes.items_review_container}>
        //             <ItemsReview />
        //         </div>
        //     ) : null;

        const placeOrderButton =
            checkoutStep === CHECKOUT_STEP.REVIEW ? (
                <Button
                    onClick={handlePlaceOrder}
                    priority="high"
                    className={classes.place_order_button}
                    loading={
                        isUpdating || placeOrderLoading || orderDetailsLoading
                    }
                    disabled={
                        isUpdating || placeOrderLoading || orderDetailsLoading || !selectApotik
                    }
                >
                    <FormattedMessage
                        id={'checkoutPage.placeOrder'}
                        defaultMessage={'Place Order'}
                    />
                </Button>
            ) : null;

        // If we're on mobile we should only render price summary in/after review.
        const shouldRenderPriceSummary = !(
            isMobile && checkoutStep < CHECKOUT_STEP.REVIEW
        );

        const orderSummary = shouldRenderPriceSummary ? (
            <div className={classes.summaryContainer}>
                <OrderSummary
                    isUpdating={isUpdating}
                    loadingRefetchDataCart={loadingRefetchDataCart}
                    setLoadingRefetchDataCart={setLoadingRefetchDataCart}
                    selectedPoints={selectedPoints}
                    onLoyaltyPointsLoaded={handleLoyaltyPointsLoaded}
                />
                {reviewOrderButton}
            </div>
        ) : null;

        let headerText;

        if (isGuestCheckout) {
            headerText = formatMessage({
                id: 'checkoutPage.guestCheckout',
                defaultMessage: 'Guest Checkout'
            });
        } else if (customer.default_shipping) {
            headerText = formatMessage({
                id: 'checkoutPage.reviewAndPlaceOrder',
                defaultMessage: 'Review and Place Order'
            });
        } else {
            headerText = formatMessage(
                { id: 'checkoutPage.greeting', defaultMessage: 'Welcome' },
                { firstname: customer.firstname }
            );
        }

        const checkoutContentClass =
            activeContent === 'checkout'
                ? classes.checkoutContent
                : classes.checkoutContent_hidden;

        const stockStatusMessageElement = (
            <Fragment>
                <FormattedMessage
                    id={'checkoutPage.stockStatusMessage'}
                    defaultMessage={
                        'An item in your cart is currently out-of-stock and must be removed in order to Checkout. Please return to your cart to remove the item.'
                    }
                />
                <Link className={classes.cartLink} to={'/cart'}>
                    <FormattedMessage
                        id={'checkoutPage.returnToCart'}
                        defaultMessage={'Return to Cart'}
                    />
                </Link>
            </Fragment>
        );
        checkoutContent = (
            <div className={checkoutContentClass}>
                <div className={classes.heading_container}>
                    <FormError
                        classes={{
                            root: classes.formErrors
                        }}
                        errors={formErrors}
                    />
                    <StockStatusMessage
                        cartItems={cartItems}
                        message={stockStatusMessageElement}
                    />
                    <div className={classes.heading}>{headerText}</div>
                </div>
                {signInContainerElement}
                {/* PurchasedItems - 在 PC 端显示在 Pharmacy Description 上方，使用表格布局和购物车桌面端一致 */}
                <div className={classes.purchasedItemsContainer}>
                    <PurchasedItemsTableList />
                </div>
                {/* Dropdown input */}
                <div className={classes.selectContainer}>
                    <h3 className="title">
                        <FormattedMessage
                            id={'checkoutPage.apotekLocation'}
                            defaultMessage={'Shipping address'}
                        />
                    </h3>
                    <div className={classes.selectBox}>
                        <span className={classes.selectText}>
                            <FormattedMessage
                                id={'checkoutPage.pleaseSelectApotek'}
                                defaultMessage={'Please Select Apotek:'}
                            />
                        </span>
                        <Select className="checkout_select" value={apotikList && apotikList.find(v => v.value === selectApotik)} onChange={handleselectApotik} options={apotikList || []}>
                        </Select>
                    </div>
                    {/* <select value={selectApotik} onChange={handleselectApotik}>
                        {selectApotik === '' && <option value="">Pilih Apotek</option>}
                        {dataApotik && dataApotik.CustomLocationStore.map((option, index) => (
                            <option key={option.loc_id} value={option.loc_code} disabled={index !== 0}>
                                {option.loc_name}
                            </option>
                        ))}
                    </select> */}
                </div>
                {isPickup &&
                    <div className={classes.store_pickup_container}>
                        <StorePickup
                            selectedMethod={selectedMethod}
                            setSelectedMethod={setSelectedMethod}
                            dataApotik={dataApotik && dataApotik.CustomLocationStore.find(e => e.loc_code === selectApotik)}
                            pageIsUpdating={isUpdating}
                        />
                    </div>
                }

                {selectedMethod === 'home' &&
                    <div className={classes.shipping_information_container}>
                        <ScrollAnchor ref={shippingInformationRef}>
                            <ShippingInformation
                                onSave={setShippingInformationDone}
                                onSuccess={scrollShippingInformationIntoView}
                                toggleActiveContent={toggleAddressBookContent}
                            />
                        </ScrollAnchor>
                    </div>
                }
                <div className={classes.shipping_method_container}>
                    <div className={classes.payment_method_container} id="PaymentMethodComponentTarget">
                    </div>
                    <ScrollAnchor ref={shippingMethodRef}>
                        {shippingMethodSection}
                    </ScrollAnchor>
                </div>
                <div className={classes.payment_information_container}>
                    {paymentInformationSection}
                </div>
                {priceAdjustmentsSection}
                <div className={classes.shipping_redeem}>
                    <h3 className={classes.redeem}>
                        <FormattedMessage
                            id={'checkoutPage.redeemYourPoints'}
                            defaultMessage={'Redeem Your Points'}
                        />
                    </h3>
                    <div className={classes.redeem_notice}>
                        <span className={classes.redeem_notice_icon}>i</span>
                        <FormattedMessage
                            id={'checkoutPage.redeemPointsRefundNotice'}
                            defaultMessage={
                                'Point Redemption transaction is non-refundable/non-exchangeable.'
                            }
                        />
                    </div>
                    <div className={classes.redeem_container}>
                        <span className={classes.redeem_text} id="redeem_points">
                            <FormattedMessage
                                id={'checkoutPage.myPoints'}
                                defaultMessage={'My Points {points}'}
                                values={{ points: Number(redeemPointsBalance).toLocaleString() }}
                            />
                        </span>
                        <div className={classes.shipping_apply}>
                            {
                                selectedPoints ? <div>
                                    <span style={{ color: '#BDBDBD', marginRight: 16 }}>-IDR {formatPoints(selectedPoints)}</span>
                                    <span onClick={async () => {
                                        // 解冻积分
                                        isPointsManuallyCleared.current = true;
                                        setSelectedPoints(null);
                                        await applyPointsToCart(0);
                                    }}>Cancel</span>
                                </div> : <span onClick={() => setIsPointsDrawerOpen(true)}>Apply</span>
                            }
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M9.7775 6.4675L5.7775 2.4675C5.4875 2.1775 5.0075 2.1775 4.7175 2.4675C4.4275 2.7575 4.4275 3.2375 4.7175 3.5275L8.1875 6.9975L4.7175 10.4675C4.4275 10.7575 4.4275 11.2375 4.7175 11.5275C4.8675 11.6775 5.0575 11.7475 5.2475 11.7475C5.4375 11.7475 5.6275 11.6775 5.7775 11.5275L9.7775 7.5275C10.0675 7.2375 10.0675 6.7575 9.7775 6.4675Z" fill="#FF8200" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* {itemsReview} */}
                {orderSummary}
                {placeOrderButton}
                {priceSummaryMobile}
            </div>
        );
    }


    const addressBookElement = !isGuestCheckout ? (
        <AddressBook
            activeContent={activeContent}
            toggleActiveContent={toggleAddressBookContent}
            onSuccess={scrollShippingInformationIntoView}
        />
    ) : null;

    const signInElement = isGuestCheckout ? (
        <GuestSignIn
            isActive={activeContent === 'signIn'}
            toggleActiveContent={toggleSignInContent}
        />
    ) : null;

    return (
        <>
            <div className={classes.root}>
                <StoreTitle>
                    {formatMessage({
                        id: 'checkoutPage.titleCheckout',
                        defaultMessage: 'Checkout'
                    })}
                </StoreTitle>
                <HeadMitrans />
                <EventPreview isPageReady={!isLoading} />
                {checkoutContent}
                {addressBookElement}
                {signInElement}
                <PointsDrawer
                    isOpen={isPointsDrawerOpen}
                    onClose={() => setIsPointsDrawerOpen(false)}
                    get_redeem_points={redeemPointsBalance}
                    onConfirm={async (points) => {
                        // 用户选择积分，重置手动取消标志
                        isPointsManuallyCleared.current = false;
                        setSelectedPoints(points);
                        setIsPointsDrawerOpen(false)
                        await applyPointsToCart(points);
                    }}
                />
            </div>
            <VerifyEmailModal open={isVerifyEmailModalOpen} onConfirm={handleVerifyEmailConfirm} onClose={() => setIsVerifyEmailModalOpen(false)} />
            <VerifyEmailCodeModal open={isVerifyEmailCodeModalOpen} email={email} onConfirm={handleVerifyEmailCodeConfirm} onClose={() => setIsVerifyEmailCodeModalOpen(false)} />
        </>
    );
};

export default CheckoutPage;

CheckoutPage.propTypes = {
    classes: shape({
        root: string,
        checkoutContent: string,
        checkoutContent_hidden: string,
        heading_container: string,
        heading: string,
        cartLink: string,
        stepper_heading: string,
        shipping_method_heading: string,
        payment_information_heading: string,
        signInContainer: string,
        signInLabel: string,
        signInButton: string,
        empty_cart_container: string,
        shipping_information_container: string,
        shipping_method_container: string,
        payment_information_container: string,
        price_adjustments_container: string,
        items_review_container: string,
        summaryContainer: string,
        formErrors: string,
        review_order_button: string,
        place_order_button: string
    })
};
