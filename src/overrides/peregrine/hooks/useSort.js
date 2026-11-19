import { useState } from 'react';

// The initial sort is the "Default" sentinel: a null
// attribute/direction pair the query talons resolve to the
// page's own default ordering (category -> position ASC,
// search -> relevance DESC, always merged with
// stock_status DESC). This keeps the sort button label in
// sync with the app ("Default" selected until the user
// picks an explicit option).
const defaultSort = {
    sortText: 'Default',
    sortId: 'productSort.default',
    sortAttribute: null,
    sortDirection: null,
};

const sortingChoise = () => defaultSort;

/**
 *
 * @param props
 * @returns {[{sortDirection: string|null, sortAttribute: string|null, sortText: string}, React.Dispatch<React.SetStateAction<{sortDirection: string|null, sortAttribute: string|null, sortText: string}>>]}
 */
export const useSort = (props = {}) =>
    // useState(() => Object.assign({}, defaultSort, props));
    useState(() => Object.assign({}, sortingChoise(props.isSearch), props));
