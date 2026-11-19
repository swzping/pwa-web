import React, { Fragment, Suspense, useState } from 'react';
import { shape, string } from 'prop-types';
import { ShoppingBag as ShoppingCartIcon } from 'react-feather';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Price } from '@magento/peregrine';
import { useCartTrigger } from '../../../peregrine/talons/Header/useCartTrigger';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { Cart2Outlined } from '@/assets/icons'
import defaultClasses from './cartTrigger.module.css';
import { GET_ITEM_COUNT_QUERY } from './cartTrigger.gql';

// const MiniCart = React.lazy(() => import('@magento/venia-ui/lib/components/MiniCart'));
const MiniCart = React.lazy(() => import('../MiniCart'));

const CartTrigger = props => {

    const {
        handleLinkClick,
        handleTriggerClick,
        data,
        itemCount,
        miniCartRef,
        miniCartIsOpen,
        hideCartTrigger,
        setMiniCartIsOpen,
        miniCartTriggerRef
    } = useCartTrigger({
        queries: {
            getItemCountQuery: GET_ITEM_COUNT_QUERY
        }
    });

    const [ cartCount, setCartCount ] = useState(0)

    const location = useLocation();

    // const currency = data ? data.cart.prices.subtotal_excluding_tax.currency : 'IDR';
    // const prices = data ? data.cart.prices.subtotal_excluding_tax.value : 0;

    const classes = useStyle(defaultClasses, props.classes);
    const history = useHistory();
    const { formatMessage } = useIntl();
    const buttonAriaLabel = formatMessage(
        {
            id: 'cartTrigger.ariaLabel',
            defaultMessage:
                'Toggle mini cart. You have {count} items in your cart.'
        },
        { count: itemCount }
    );
    const itemCountDisplay = itemCount > 99 ? '99+' : itemCount;
    const triggerClassName = miniCartIsOpen
        ? classes.triggerContainer_open
        : classes.triggerContainer;

    const maybeItemCounter = itemCount ? (
        <span className={classes.counter}>{itemCountDisplay}</span>
    ) : null;

    // const handleTriggerClick = () => {
    //     history.push('/cart');
    // };

    const url = location.pathname

    const hideBottomNav = url.endsWith('.html') || [
        '/checkout',
        '/sign-in',
        '/create-account',
        '/order-history'
    ].includes(url);

    const getCartCountCallback = (val) => {
        setCartCount(val)
    }

    const cartTrigger = hideCartTrigger ? null : (
        // Because this button behaves differently on desktop and mobile
        // we render two buttons that differ only in their click handler
        // and control which one displays via CSS.
        <div className={classes.cartContainer}>
            <div ref={miniCartTriggerRef}>
                <button
                    className={`${classes.cartDesktop} hidden-mobile`}
                    onClick={handleTriggerClick}
                >
                    <Cart2Outlined className={classes.icon} />
                    <div className={classes.cartDesktopItem}>{cartCount ? `Rp,${cartCount}` : 'Rp 0'}</div>
                    {/* <Price
                        currencyCode={currency}
                        value={prices}
                    /> */}
                    { itemCountDisplay ? <div className={classes.cartItemNum}>{itemCountDisplay}</div> : null }
                </button>
            </div>

            {
                hideBottomNav ? <button
                    aria-label={buttonAriaLabel}
                    className={`${classes.link} ${classes.cartMobile} hidden-desktop`}
                    onClick={handleTriggerClick}
                >
                    <i className="icon-cart"></i>
                    {maybeItemCounter}
                </button> : null
            }

            <Suspense fallback={null}>
                <MiniCart
                    isOpen={miniCartIsOpen}
                    setIsOpen={setMiniCartIsOpen}
                    ref={miniCartRef}
                    getCartCountCallback={getCartCountCallback}
                />
            </Suspense>
        </div>
    );

    return cartTrigger;
};

export default CartTrigger;

CartTrigger.propTypes = {
    classes: shape({
        counter: string,
        link: string,
        openIndicator: string,
        root: string,
        trigger: string,
        triggerContainer: string
    })
};
