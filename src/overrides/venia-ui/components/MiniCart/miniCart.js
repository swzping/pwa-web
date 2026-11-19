import React, { Fragment, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    Lock as LockIcon,
    AlertCircle as AlertCircleIcon,
    X as CloseIcon
} from 'react-feather';
import { bool, shape, string } from 'prop-types';
import { ChevronDown, ChevronUp } from 'react-feather';

import { useScrollLock, Price, useToasts } from '@magento/peregrine';
import { useCartPage } from '@magento/peregrine/lib/talons/CartPage/useCartPage';
import { useMiniCart } from '@magento/peregrine/lib/talons/MiniCart/useMiniCart';
import { useStyle } from '@magento/venia-ui/lib/classify';

import Button from '@magento/venia-ui/lib/components/Button';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Trigger from '@magento/venia-ui/lib/components/Trigger';
// import StockStatusMessage from '@magento/venia-ui/lib/components/StockStatusMessage';
import MobileProductListing from '../CartPage/ProductListing/MobileProductListing';
import PriceSummary from '@magento/venia-ui/lib/components/CartPage/PriceSummary';
// import ProductList from '@magento/venia-ui/lib/components/MiniCart/ProductList';
import defaultClasses from './miniCart.module.css';
import operations from '@magento/venia-ui/lib/components/MiniCart/miniCart.gql';
import FreeDelivery from '@/modules/custom-modules/components/FreeDelivery';
import { CloseOutlined } from '@/assets/icons'
import MiniCartShimmer from './miniCart.shimmer';
import CartFreeGift from '@/modules/swift-pwa-ui/components/FreeGift/CartFreeGift';

const errorIcon = <Icon src={AlertCircleIcon} size={20} />;
const MINUS_SYMBOL = '-';

/**
 * The MiniCart component shows a limited view of the user's cart.
 *
 * @param {Boolean} props.isOpen - Whether or not the MiniCart should be displayed.
 * @param {Function} props.setIsOpen - Function to toggle mini cart
 */
const MiniCart = React.forwardRef((props, ref) => {
    const { isOpen, setIsOpen, getCartCountCallback } = props;

    // Prevent the page from scrolling in the background
    // when the MiniCart is open.
    useScrollLock(isOpen);

    const talonProps = useMiniCart({
        isOpen,
        setIsOpen,
        operations,
        getCartCountCallback
    });

    const talonCartPageProps = useCartPage();

    const {
        cartItems,
        hasItems,
        totalItems,
        isCartUpdating,
        fetchCartDetails,
        onAddToWishlistSuccess,
        setIsCartUpdating,
        shouldShowLoadingIndicator,
    } = talonCartPageProps;

    const {
        closeMiniCart,
        errorMessage,
        handleEditCart,
        loading,
        productListItems,
    } = talonProps;
    const [editMobile, setEditMobile] = useState(false);
    const classes = useStyle(defaultClasses, props.classes);
    const rootClass = isOpen ? classes.root_open : classes.root;
    const contentsClass = isOpen ? classes.contents_open : classes.contents;
    const quantityClassName = loading
        ? classes.quantity_loading
        : classes.quantity;
    const priceClassName = loading ? classes.price_loading : classes.price;

    const isCartEmptyItems = !(productListItems && productListItems.length);

    const [, { addToast }] = useToasts();

    useEffect(() => {
        if (errorMessage) {
            addToast({
                type: 'error',
                icon: errorIcon,
                message: errorMessage,
                dismissable: true,
                timeout: 7000
            });
        }
    }, [addToast, errorMessage]);

    const header = (
        <Fragment>
            <Trigger key="backButton" action={closeMiniCart}>
                <Icon src={CloseOutlined} size={28} />
            </Trigger>
            <div className={classes.headerTitle}>
                <FormattedMessage
                    id={'cartPage.shoppingCart'}
                    defaultMessage={'Shopping Cart'}
                />
            </div>
        </Fragment>
    );

    const loadingComponent = (
        <>
            <div className={classes.header}>{header}</div>
            <div className={classes.body}>
                <MiniCartShimmer />
            </div>
        </>
    );

    const productListing = hasItems ? (
        <MobileProductListing
            onAddToWishlistSuccess={onAddToWishlistSuccess}
            setIsCartUpdating={setIsCartUpdating}
            fetchCartDetails={fetchCartDetails}
            isCartUpdating={isCartUpdating}
            editMobile={editMobile}
            isMiniCart={true}
        />
    ) : (
        <h3>
            <FormattedMessage
                id={'cartPage.emptyCart'}
                defaultMessage={'There are no items in your cart.'}
            />
        </h3>
    );

    const priceSummary = hasItems ? (
        <PriceSummary isUpdating={isCartUpdating} totalItems={totalItems} isMobile={true} content={
            <div className={classes.moreButtons}>
                <Button
                    onClick={handleEditCart}
                    priority="high"
                    className={classes.editCartButton}
                    disabled={loading || isCartEmptyItems}
                >
                    <FormattedMessage
                        id={'miniCart.editCartButton'}
                        defaultMessage={'Go to Cart'}
                    />
                </Button>
            </div>

        } />
    ) : null;

    const contents = isCartEmptyItems ? (
        <Fragment>
            <div className={classes.header}>{header}</div>
            <div className={classes.emptyCart}>
                <div className={classes.emptyMessage}>
                    <FormattedMessage
                        id={'miniCart.emptyMessage'}
                        defaultMessage={'There are no items in your cart.'}
                    />
                </div>
            </div>
        </Fragment>
    ) : (
        <Fragment>
            <div className={classes.header}>{header}</div>
            <div className={classes.body}>
                <FreeDelivery />
                <CartFreeGift isMiniCart={true} />
                {productListing}
            </div>
            <div className={classes.summary_container}>
                <div className={classes.summary_contents}>
                    {priceSummary}
                </div>
            </div>
        </Fragment>
    );

    return (
        <aside className={rootClass}>
            <div ref={ref} className={contentsClass}>
                {loading ? loadingComponent : contents}
            </div>
        </aside>
    );
});

export default MiniCart;

MiniCart.propTypes = {
    classes: shape({
        root: string,
        root_open: string,
        contents: string,
        contents_open: string,
        header: string,
        body: string,
        footer: string,
        checkoutButton: string,
        editCartButton: string,
        emptyCart: string,
        emptyMessage: string,
        stockStatusMessageContainer: string
    }),
    isOpen: bool
};
