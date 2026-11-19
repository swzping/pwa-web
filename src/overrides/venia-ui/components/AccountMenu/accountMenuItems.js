import React from 'react';
import { func, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useAccountMenuItems } from '@magento/peregrine/lib/talons/AccountMenu/useAccountMenuItems';
import defaultClasses from './accountMenuItems.module.css';

const AccountMenuItems = props => {
    const { onSignOut } = props;

    const talonProps = useAccountMenuItems({ onSignOut });
    const { handleSignOut, menuItems } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);

    let cloneMenuItems = [
        ...menuItems,
        {
            name: 'Reward Point',
            id: 'Reward Point',
            url: '/reward-points'
        }
    ];
    cloneMenuItems = [
        ...cloneMenuItems,
        {
            name: 'Store Credit',
            id: 'Store Credit',
            url: '/store-credit'
        }
    ];
    cloneMenuItems = [
        ...cloneMenuItems,
        {
            name: 'Product Review',
            id: 'Product Review',
            url: '/product-review'
        }
    ];
    // cloneMenuItems = [
    //     ...cloneMenuItems,
    //     {
    //         name: 'Notification',
    //         id: 'Notification',
    //         url: '/notification'
    //     }
    // ];
    cloneMenuItems = [
        ...cloneMenuItems,
        {
            name: 'Newsletter',
            id: 'Newsletter',
            url: '/newsletter'
        }
    ];
    cloneMenuItems = [
        ...cloneMenuItems,
        {
            name: 'Refer a Friend',
            id: 'Referral Friend',
            url: '/raf'
        }
    ];

    const menu = cloneMenuItems.map(item => {
        return (
            <Link className={classes.link} key={item.name} to={item.url} onClick={() => {
                // item.url == '/account-information'
                localStorage.setItem('accountTab', 0)
            }}>
                <FormattedMessage id={item.id} defaultMessage={item.name} />
            </Link>
        );
    });

    return (
        <div className={classes.root}>
            {menu}
            <button
                className={classes.signOut}
                onClick={handleSignOut}
                type="button"
            >
                <FormattedMessage
                    id={'accountMenu.signOutButtonText'}
                    defaultMessage={'Logout'}
                />
            </button>
        </div>
    );
};

export default AccountMenuItems;

AccountMenuItems.propTypes = {
    classes: shape({
        link: string,
        signOut: string
    }),
    onSignOut: func
};
