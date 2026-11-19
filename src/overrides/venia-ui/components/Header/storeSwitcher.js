import React from 'react';
import { ChevronDown } from 'react-feather';
import { shape, string } from 'prop-types';

import { useStoreSwitcher } from '@magento/peregrine/lib/talons/Header/useStoreSwitcher';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import defaultClasses from '@magento/venia-ui/lib/components/Header/storeSwitcher.module.css';
import SwitcherItem from '@magento/venia-ui/lib/components/Header/switcherItem';
import Shimmer from '@magento/venia-ui/lib/components/Header/storeSwitcher.shimmer';

const CaretDownIcon = <Icon classes={{ icon: defaultClasses.icon }} src={ChevronDown} size={12} />;

const StoreSwitcher = props => {
    const {
        availableStores,
        currentGroupName,
        currentStoreName,
        handleSwitchStore,
        storeGroups,
        storeMenuRef,
        storeMenuTriggerRef,
        storeMenuIsOpen,
        handleTriggerClick
    } = useStoreSwitcher();

    const classes = useStyle(defaultClasses, props.classes);
    const menuClassName = storeMenuIsOpen ? classes.menu_open : classes.menu;

    if (!availableStores) return <Shimmer />;

    // if (availableStores.size <= 1) return null;

    const groups = [];
    const hasOnlyOneGroup = storeGroups.size === 1;

    storeGroups.forEach((group, key) => {
        const stores = [];
        group.forEach(({ storeGroupName, storeName, isCurrent, code }) => {
            let label;
            if (hasOnlyOneGroup) {
                label = `${storeName}`;
            } else {
                label = `${storeGroupName} - ${storeName}`;
            }
            stores.push(
                <li key={code} className={classes.menuItem}>
                    <SwitcherItem
                        active={isCurrent}
                        onClick={handleSwitchStore}
                        option={code}
                    >
                        {label}
                    </SwitcherItem>
                </li>
            );
        });

        groups.push(
            <ul className={classes.groupList} key={key}>
                {stores}
            </ul>
        );
    });

    const triggerLabel = 'STORE LOCATOR';
    // if (hasOnlyOneGroup) {
    //     triggerLabel = `${currentStoreName}`;
    // } else {
    //     triggerLabel = `${currentGroupName} - ${currentStoreName}`;
    // }

    return (
        <div className={`${classes.root} hidden-mobile`}>
            <button
                className={classes.trigger}
                aria-label={currentStoreName}
                onClick={handleTriggerClick}
                ref={storeMenuTriggerRef}
            >

                {/* {triggerLabel} */}
                {/* {CaretDownIcon} */}
                <i className="icon-store"></i>
            </button>
            <div ref={storeMenuRef} className={menuClassName}>
                <div className={classes.groups}>{groups}</div>
            </div>
        </div>
    );
};

export default StoreSwitcher;

StoreSwitcher.propTypes = {
    classes: shape({
        groupList: string,
        groups: string,
        menu: string,
        menu_open: string,
        menuItem: string,
        root: string,
        trigger: string
    })
};
