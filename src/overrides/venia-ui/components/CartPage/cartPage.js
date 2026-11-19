import React, { useEffect, useState, useContext, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Check } from 'react-feather';
import { useCartPage } from '@magento/peregrine/lib/talons/CartPage/useCartPage';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useToasts } from '@magento/peregrine';
import { gql, useMutation } from '@apollo/client';
import { markFromCart } from '@/helpers/cartAutoApplyVoucher';

import Icon from '@magento/venia-ui/lib/components/Icon';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import StockStatusMessage from '@magento/venia-ui/lib/components/StockStatusMessage';
import PriceAdjustments from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments';
import PriceSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary';
import ProductListing from '@magento/venia-ui/lib/components/CartPage/ProductListing';
import FreeDelivery from '@/modules/custom-modules/components/FreeDelivery';
import { useWindowSize } from '@magento/peregrine/lib/hooks/useWindowSize';
import defaultClasses from './cartPage.module.css';
import { HeaderContext } from '../../../peregrine/context/header';
import CartPageShimmer from './cartPage.shimmer';
import CartFreeGift from '@/modules/swift-pwa-ui/components/FreeGift/CartFreeGift';
import { shouldResetLoyaltyPoints } from './cartPageUtils';

const CheckIcon = <Icon size={20} src={Check} />;
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

/**
 * Structural page component for the shopping cart.
 * This is the main component used in the `/cart` route in Venia.
 * It uses child components to render the different pieces of the cart page.
 *
 * @see {@link https://venia.magento.com/cart}
 *
 * @param {Object} props
 * @param {Object} props.classes CSS className overrides for the component.
 * See [cartPage.module.css]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/cartPage.module.css}
 * for a list of classes you can override.
 *
 * @returns {React.Element}
 *
 * @example <caption>Importing into your project</caption>
 * import CartPage from "@magento/venia-ui/lib/components/CartPage";
 */
const CartPage = props => {
    const talonProps = useCartPage({ shouldResetAutoApplyVoucher: true });

    const {
        cartItems,
        hasItems,
        totalItems,
        isCartUpdating,
        isResettingAutoVoucher,
        fetchCartDetails,
        onAddToWishlistSuccess,
        setIsCartUpdating,
        shouldShowLoadingIndicator,
        wishlistSuccessProps
    } = talonProps;

    const { setNavConfig } = useContext(HeaderContext);
    const [{ isSignedIn }] = useUserContext();
    const classes = useStyle(defaultClasses, props.classes);
    const { formatMessage } = useIntl();
    const [, { addToast }] = useToasts();
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 768;

    const [editMobile, setEditMobile] = useState(false);
    const [flashSaleNow, setFlashSaleNow] = useState(Date.now);
    const hasCartFlashSale = cartItems.some(item => item?.product?.is_flash_sale === 1);
    const hasEndedFlashSale = cartItems.some(item => {
        const product = item?.product;
        if (product?.is_flash_sale !== 1 || !product.special_to_date) return false;
        // Promotion dates without an explicit timezone are UTC.
        const date = product.special_to_date.trim().replace(' ', 'T');
        const endTime = Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) ? date : `${date}Z`);
        return flashSaleNow >= endTime;
    });

    useEffect(() => {
        if (!hasCartFlashSale) return;
        setFlashSaleNow(Date.now());
        const timer = setInterval(() => setFlashSaleNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [hasCartFlashSale]);

    const [loadingRefetchDataCart, setLoadingRefetchDataCart] = useState(false);
    const [loyaltyPointState, setLoyaltyPointState] = useState({
        appliedPoints: 0,
        grandTotal: 0
    });
    const [updatePointsInCart] = useMutation(UPDATE_POINTS_IN_CART);

    const handleCartQuantityChanged = useCallback(
        async ({ cartId }) => {
            try {
                if (
                    shouldResetLoyaltyPoints(
                        loyaltyPointState.appliedPoints,
                        loyaltyPointState.grandTotal
                    )
                ) {
                    await updatePointsInCart({
                        variables: {
                            cartId,
                            points: 0
                        }
                    });
                    setLoyaltyPointState(prevState => ({
                        ...prevState,
                        appliedPoints: 0
                    }));
                }
                fetchCartDetails({ variables: { cartId } });
                setLoadingRefetchDataCart(true);
            } catch (error) {
                addToast({
                    type: 'error',
                    message: error?.message || 'Failed to clear points',
                    dismissable: true,
                    timeout: 7000
                });
            }
        },
        [addToast, fetchCartDetails, loyaltyPointState, updatePointsInCart]
    );

    const editMobileClick = () => {
        setEditMobile(!editMobile);
    };

    useEffect(() => {
        setNavConfig({
            headerTitle: formatMessage({
                id: 'cartPage.shoppingCart',
                defaultMessage: 'Shopping Cart'
            }),
            useCart: false
        });
        return () => {
            localStorage.setItem('cartPageReloaded', '')
        }
    }, []);

    // 已登录用户从购物车页直接进入 checkout 时打标，checkout 消费后跳过本次
    // resetAutoApplyVoucher（购物车页已 reset 过）。react-router v5 中
    // cleanup 执行时 window.location 已是导航目标路由。
    useEffect(() => () => {
        if (isSignedIn && window.location.pathname.startsWith('/checkout')) {
            markFromCart();
        }
    }, [isSignedIn]);

    useEffect(() => {
        if (wishlistSuccessProps) {
            addToast({ ...wishlistSuccessProps, icon: CheckIcon });
        }
    }, [addToast, wishlistSuccessProps]);

    // While the auto-apply voucher reset is pending, block the whole page
    // (shimmer) so no cart data query (items, prices, coupons, free gifts) is
    // issued before the reset completes.
    if (shouldShowLoadingIndicator || isResettingAutoVoucher) {
        return <CartPageShimmer />;
    }

    const productListing = hasItems ? (
        <ProductListing
            onAddToWishlistSuccess={onAddToWishlistSuccess}
            setIsCartUpdating={setIsCartUpdating}
            fetchCartDetails={fetchCartDetails}
            isCartUpdating={isCartUpdating}
            editMobile={editMobile}
            onCartQuantityChanged={handleCartQuantityChanged}
        />
    ) : (
        <h3>
            <FormattedMessage
                id={'cartPage.emptyCart'}
                defaultMessage={'There are no items in your cart.'}
            />
        </h3>
    );

    const priceAdjustments = hasItems ? (
        <PriceAdjustments setIsCartUpdating={setIsCartUpdating} />
    ) : null;

    const priceSummary = hasItems ? (
        <PriceSummary
            isUpdating={isCartUpdating}
            totalItems={totalItems}
            loadingRefetchDataCart={loadingRefetchDataCart}
            setLoadingRefetchDataCart={setLoadingRefetchDataCart}
            onLoyaltyPointsLoaded={setLoyaltyPointState}
        />
    ) : null;

    return (
        <div className={classes.root}>
            { !localStorage.getItem('cartPageReloaded') && hasEndedFlashSale && <div className={classes.mask}>
                <div className={classes.maskContent}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#212121' }}>Flash sales have ended</span>
                    <p className={classes.maskContentText}>Current flash sales items will return to their original prices！</p>
                    <div className={classes.sureBtn} onClick={() => {
                        location?.reload()
                        localStorage.setItem('cartPageReloaded', true)
                    }}>OK</div>
                </div>
            </div>}
            <StoreTitle>
                {formatMessage({
                    id: 'cartPage.title',
                    defaultMessage: 'Cart'
                })}
            </StoreTitle>
            <div className={classes.heading_container}>
                <h1 className={`${classes.heading} hidden-mobile`}>
                    <FormattedMessage
                        id={'cartPage.shoppingCart'}
                        defaultMessage={'Shopping Cart'}
                    />
                </h1>
                <p className={`${classes.subTitle} hidden-mobile`}>
                    {totalItems} {' '}
                    <FormattedMessage
                        id={'miniCart.customtotalQuantity'}
                        defaultMessage={' items in your order'}
                    />
                </p>
                {hasItems && isMobile ? <FreeDelivery /> : null}
                <div className={classes.stockStatusMessageContainer}>
                    <StockStatusMessage cartItems={cartItems} />
                </div>
            </div>

            <div className={classes.body}>
                <div className={classes.items_container}>
                    <CartFreeGift />
                    {productListing}
                </div>
                {/* <div className={classes.price_adjustments_container}>
                    {priceAdjustments}
                </div> */}
                <div className={classes.summary_container}>
                    {(!hasItems || isMobile) ? null : <FreeDelivery />}
                    <div className={classes.summary_contents}>
                        {priceSummary}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
