import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartTrigger } from '@magento/peregrine/lib/talons/Header/useCartTrigger';
import { GET_ITEM_COUNT_QUERY } from '@magento/venia-ui/lib/components/Header/cartTrigger.gql';
import { Home, CategoriesOutline, LocationPinOutline, AccountCircleOutline, CartOutlined } from '@/assets/icons';
import styles from './index.module.css';
import classNames from 'classnames';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { trackNavigationButtonClick } from '@/utils/track';


const BottomNavigation = () => {
    const [{ isSignedIn }] = useUserContext();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const getHideNav = searchParams.get('hideBottomNav');

    const {
        itemCount,
    } = useCartTrigger({
        queries: {
            getItemCountQuery: GET_ITEM_COUNT_QUERY
        }
    });

    const itemCountDisplay = itemCount > 99 ? '99+' : itemCount;
    const url = location.pathname;    

    const hideBottomNav = url.endsWith('.html') || [
        '/checkout',
        '/sign-in',
        '/create-account',
        '/order-history',
        '/freegift',
        '/freegift/recommendation',
        '/freegift/rules'
    ].includes(url);

    if (hideBottomNav || getHideNav === '1') {
        return null;
    }

    const maybeItemCounter = itemCount ? (
        <span className={styles.counter}>{itemCountDisplay}</span>
    ) : null;

    const navItems = [
        {
            to: '/',
            icon: <Home className={styles.icon} />,
            label: 'Home',
            isActive: url === '/'
        },
        {
            to: '/category', // Using button for categories
            icon: <CategoriesOutline className={styles.icon} />,
            label: 'Categories',
            isActive: url === '/category'
        },
        {
            to: '/cart', // Using button for categories
            icon: <CartOutlined className={styles.icon} />,
            label: 'Cart',
            info: maybeItemCounter,
            isActive: url === '/cart'
        },
        {
            to: '/store-locator',
            icon: <LocationPinOutline className={styles.icon} />,
            label: 'Shop',
            isActive: url === '/store-locator'
        },
        {
            to: isSignedIn ? '/account-information' : 'sign-in',
            icon: <AccountCircleOutline className={styles.icon} />,
            label: 'My Account',
            isActive: ['/customer/account', '/account-information'].includes(url)
        }
    ];
    const handleMenuClick = (item) => {
        trackNavigationButtonClick({
            name: item.label || "",
        })
    };

    return (
        <div className={styles.root}>
            <nav className="navbar fixed-bottom bg-white">
                {navItems.map((item, index) => (
                    <div key={index} className={classNames(styles.box, { [styles.active]: item.isActive })}>
                        {item.to ? (
                            <Link to={item.to} onClick={() => handleMenuClick(item)}>
                                {item.icon}
                                {item.info}
                                <p className={classNames({ [styles.active]: item.isActive })}>{item.label}</p>
                            </Link>
                        ) : (
                            <button onClick={item.onClick}>
                                {item.icon}
                                {item.info}
                                <p>{item.label}</p>
                            </button>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default BottomNavigation;
