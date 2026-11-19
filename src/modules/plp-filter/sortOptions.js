/**
 * ---------------------------------------------------- *
 * Sort options for the PLP, matching the app-guardian
 * sortByPLP order (Constants.js). "Default" carries a null
 * attribute / direction sentinel — the query talons resolve
 * it to the page's initial ordering. Items are shaped for
 * the ProductSort availableSortMethods prop.
 * ---------------------------------------------------- *
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';

const defaultOption = {
    id: 'productSort.default',
    text: <FormattedMessage id={'productSort.default'} defaultMessage={'Default'} />,
    attribute: null,
    sortDirection: null,
};

const bestMatchOption = {
    id: 'sortItem.relevance',
    text: <FormattedMessage id={'sortItem.relevance'} defaultMessage={'Best Match'} />,
    attribute: 'relevance',
    sortDirection: 'DESC',
};

const positionOption = {
    id: 'sortItem.position',
    text: <FormattedMessage id={'sortItem.position'} defaultMessage={'Position'} />,
    attribute: 'position',
    sortDirection: 'ASC',
};

const priceAscOption = {
    id: 'sortItem.priceAsc',
    text: <FormattedMessage id={'sortItem.priceAsc'} defaultMessage={'Price: Low to High'} />,
    attribute: 'price',
    sortDirection: 'ASC',
};

const priceDescOption = {
    id: 'sortItem.priceDesc',
    text: <FormattedMessage id={'sortItem.priceDesc'} defaultMessage={'Price: High to Low'} />,
    attribute: 'price',
    sortDirection: 'DESC',
};

const highestDiscountOption = {
    id: 'sortItem.discount',
    text: <FormattedMessage id={'sortItem.discount'} defaultMessage={'Highest Discount'} />,
    attribute: 'discount_percentage',
    sortDirection: 'DESC',
};

/**
 * Single source list (app parity: sortByPLP.items order).
 * Scene lists derive from it by hiding labels — the old
 * sortByPLP/sortBySearch split only reordered
 * Position/Best Match, which the per-scene hidden
 * attributes already express (each scene hides the other
 * one). "Default" (null attribute) always stays.
 */
const SORT_OPTIONS_BASE = [
    defaultOption,
    positionOption,
    bestMatchOption,
    priceAscOption,
    priceDescOption,
    highestDiscountOption,
];

// scene-scoped visibility (GDPR-5601, app parity
// HIDDEN_SORT_LABELS_BY_TYPE): Search hides Position,
// Category hides Best Match, Brand hides both — matched by
// the option attribute here (the pwa shape's stable key for
// the same two options)
const HIDDEN_SORT_ATTRIBUTES_BY_TYPE = {
    brand: ['position', 'relevance'],
    category: ['relevance'],
    search: ['position'],
};

export const resolveSortOptions = type => {
    const hiddenAttributes = HIDDEN_SORT_ATTRIBUTES_BY_TYPE[type] || [];
    return SORT_OPTIONS_BASE.filter(item => item.attribute == null || !hiddenAttributes.includes(item.attribute));
};

export const SORT_OPTIONS_PLP = resolveSortOptions('category');

export const SORT_OPTIONS_SEARCH = resolveSortOptions('search');

/**
 * ---------------------------------------------------- *
 * @function getPageDefaultSort
 * @summary the ordering a page starts with before the
 * user picks a sort — stock_status is merged by the
 * query talons
 * ---------------------------------------------------- *
 */
export const getPageDefaultSort = isSearch => (isSearch ? { relevance: 'DESC' } : { position: 'ASC' });

/**
 * ---------------------------------------------------- *
 * @function resolveSortParam
 * @summary currentSort -> ProductAttributeSortInput; the
 * null-attribute "Default" sentinel resolves to the
 * page's default sort
 * ---------------------------------------------------- *
 */
export const resolveSortParam = (currentSort, isSearch) => {
    const { sortAttribute, sortDirection } = currentSort || {};
    if (sortAttribute) {
        return { [sortAttribute]: sortDirection };
    }
    return getPageDefaultSort(isSearch);
};

/**
 * ---------------------------------------------------- *
 * @function isSameSort
 * @summary null-safe equality so the "Default" sentinel
 * highlights alongside concrete options
 * ---------------------------------------------------- *
 */
export const isSameSort = (currentSort, sortItem) => {
    const currentAttribute = currentSort?.sortAttribute != null ? currentSort.sortAttribute : null;
    const currentDirection = currentSort?.sortDirection != null ? currentSort.sortDirection : null;
    return (
        currentAttribute === (sortItem.attribute != null ? sortItem.attribute : null) &&
        currentDirection === (sortItem.sortDirection != null ? sortItem.sortDirection : null)
    );
};
