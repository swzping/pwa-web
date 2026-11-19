import React, { useMemo, useCallback } from 'react';
import { array, arrayOf, shape, string, oneOf } from 'prop-types';
import { useDropdown } from '@magento/peregrine/lib/hooks/useDropdown';
import { useStyle } from '@magento/venia-ui/lib/classify';
import SortItem from '@magento/venia-ui/lib/components/ProductSort/sortItem';
import Button from '@magento/venia-ui/lib/components/Button';
import Popup from '../../../../modules/swift-pwa-ui/components/Popup'; // Replace with your actual Popup component path
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from './productSort.module.css';
import { SortAlignCenter, SortChevron } from '../../../../assets/icons';
import { SORT_OPTIONS_PLP, isSameSort } from '../../../../modules/plp-filter/sortOptions';

const ProductSort = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { availableSortMethods, sortProps } = props;
    const [currentSort, setSort] = sortProps;
    const { elementRef, expanded, setExpanded } = useDropdown();

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;

    const handleItemClick = useCallback(
        sortAttribute => {
            setSort({
                sortText: sortAttribute.text,
                sortId: sortAttribute.id,
                sortAttribute: sortAttribute.attribute,
                sortDirection: sortAttribute.sortDirection,
            });
            setExpanded(false);
        },
        [setExpanded, setSort],
    );

    const sortElements = useMemo(() => {
        const itemElements = Array.from(availableSortMethods, sortItem => {
            const isActive = isSameSort(currentSort, sortItem);

            const key = `${sortItem.attribute || 'default'}--${sortItem.sortDirection || 'default'}`;
            return (
                <li key={key} className={classes.menuItem}>
                    <SortItem sortItem={sortItem} active={isActive} onClick={handleItemClick} />
                </li>
            );
        });

        return <ul>{itemElements}</ul>;
    }, [availableSortMethods, classes.menuItem, currentSort, handleItemClick]);

    const handleSortClick = () => {
        setExpanded(!expanded);
    };

    return (
        <div ref={elementRef} className={classes.root} aria-live="polite" aria-busy="false">
            <Button priority={'low'} className={classes.customSortButton} onClick={handleSortClick}>
                <SortAlignCenter className={classes.sortIcon} />
                <div className={classes.mobileText}>
                    <span>{currentSort.sortText}</span>
                    <SortChevron className={classes.desktopIcon} />
                </div>
                <span className={classes.desktopText}>
                    <span className={classes.sortText}>{currentSort.sortText}</span>
                    <SortChevron className={classes.desktopIcon} />
                </span>
            </Button>
            {expanded &&
                (isMobile ? (
                    <Popup title="Sorting" isOpen={expanded} position="bottom" onClose={() => setExpanded(false)}>
                        <div className={classes.popupBody}>{sortElements}</div>
                    </Popup>
                ) : (
                    <div className={classes.menu}>{sortElements}</div>
                ))}
        </div>
    );
};

const sortDirections = oneOf(['ASC', 'DESC']);

ProductSort.propTypes = {
    classes: shape({
        menuItem: string,
        menu: string,
        root: string,
        sortButton: string,
    }),
    availableSortMethods: arrayOf(
        shape({
            text: string,
            id: string,
            attribute: string,
            sortDirection: sortDirections,
        }),
    ),
    sortProps: array,
};

ProductSort.defaultProps = {
    // app-parity option order (Default, Position, Best Match,
    // Price L2H/H2L, Highest Discount) — pages pass
    // SORT_OPTIONS_SEARCH for the search PLP instead
    availableSortMethods: SORT_OPTIONS_PLP,
};

export default ProductSort;
