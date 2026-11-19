import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { ChevronDown as ArrowDown } from 'react-feather';
import { useDropdown } from '@magento/peregrine/lib/hooks/useDropdown';
import { useStyle } from '@magento/venia-ui/lib/classify';
import SortItem from './sortItem';
import Button from '@magento/venia-ui/lib/components/Button';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Popup from '@/modules/swift-pwa-ui/components/Popup';
import { useWindowSize } from '@magento/peregrine';
import { ChevronDownOutline } from '@/assets/icons';
import defaultClasses from './orderListSort.module.css';

const ProductSort = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { activeSort, dataSource, onSortSelect, titleStyle = {} } = props;
    const { elementRef, expanded, setExpanded } = useDropdown();

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;


    const handleItemClick = useCallback(
        itemSort => {
            onSortSelect(itemSort);
            setExpanded(false);
        },
        [setExpanded]
    );

    const sortElements = useMemo(() => {
        const itemElements = dataSource?.map(item => (
            <li key={item.id} className={classes.menuItem}>
                <SortItem
                    sortItem={item}
                    active={activeSort.value == item.value}
                    onClick={() => handleItemClick(item)}
                />
            </li>
        ));
        return <ul>{itemElements}</ul>;
    }, [dataSource, activeSort]);

    const handleSortClick = () => {
        setExpanded(!expanded);
    };

    return (
        <div
            ref={elementRef}
            className={classes.root}
            aria-live="polite"
            aria-busy="false"
        >
            <Button
                priority={'low'}
                className={classes.customSortButton}
                onClick={handleSortClick}
            >
                <span className={classes.mobileText} style={titleStyle}>
                    {activeSort.label}
                    <Icon
                        src={ArrowDown}
                        classes={{
                            root: classes.desktopIconWrapper,
                            icon: classes.desktopIcon
                        }}
                    />
                </span>
                <span className={classes.desktopText} style={titleStyle}>
                    <span className={classes.sortText}>
                        {activeSort.label}
                    </span>
                    <ChevronDownOutline className={classes.desktopIcon} />
                </span>
            </Button>
            {expanded &&
                (isMobile ? (
                    <Popup
                        title="Filter"
                        isOpen={expanded}
                        position="bottom"
                        onClose={() => setExpanded(false)}
                    >
                        <div className={classes.popupBody}>{sortElements}</div>
                    </Popup>
                ) : (
                    <div className={classes.menu}>{sortElements}</div>
                ))}
        </div>
    );
};

export default ProductSort;
