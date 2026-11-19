import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useAppContext } from '@magento/peregrine/lib/context/app';

import { useFilterState } from '@magento/peregrine/lib/talons/FilterModal/';
import { getSearchFromState, getStateFromSearch, stripHtml } from '@magento/peregrine/lib/talons/FilterModal/helpers';

import { countAppliedFromUrl, supplementItemsFromUrl } from '../../../../modules/plp-filter/filterPayload';

const DRAWER_NAME = 'filter';

export const useFilterSidebar = props => {
    const { filters } = props;

    const [isApplying, setIsApplying] = useState(false);
    const [{ drawer }, { toggleDrawer, closeDrawer }] = useAppContext();
    const [filterState, filterApi] = useFilterState();
    const prevDrawer = useRef(null);
    const isOpen = drawer === DRAWER_NAME;

    const history = useHistory();
    const { pathname, search } = useLocation();

    // Category groups stay enabled — the sidebar renders them
    // as their own section and their URL params must survive
    // getSearchFromState rewrites. URL values that are not
    // aggregation options (custom price ranges) are
    // supplemented so they round-trip instead of being dropped
    const [filterNames, filterKeys, filterItems] = useMemo(() => {
        const names = new Map();
        const keys = new Set();
        const itemsByGroup = new Map();

        for (const filter of filters) {
            const { options, label: name, attribute_code: group } = filter;

            const items = [];

            // add filter name
            names.set(group, name);

            // add filter key permutations
            keys.add(`${group}[filter]`);

            // add items
            if (options && options.length && options.length > 0) {
                for (const { label, value } of options) {
                    items.push({ title: stripHtml(label), value });
                }
            }
            itemsByGroup.set(group, items);
        }

        const supplementedItems = supplementItemsFromUrl(search, keys, itemsByGroup);

        return [names, keys, supplementedItems];
    }, [filters, search]);

    // on apply, write filter state to location
    useEffect(() => {
        if (isApplying) {
            const nextSearch = getSearchFromState(search, filterKeys, filterState);

            // write filter state to history
            history.push({ pathname, search: nextSearch });

            // mark the operation as complete
            setIsApplying(false);
        }
    }, [filterKeys, filterState, history, isApplying, pathname, search]);

    const handleOpen = useCallback(() => {
        toggleDrawer(DRAWER_NAME);
    }, [toggleDrawer]);

    const handleClose = useCallback(() => {
        closeDrawer();
    }, [closeDrawer]);

    const handleApply = useCallback(() => {
        setIsApplying(true);
        handleClose();
    }, [handleClose]);

    const handleReset = useCallback(() => {
        filterApi.clear();
        setIsApplying(true);
    }, [filterApi, setIsApplying]);

    /**
     * Replace one group's selection and immediately apply
     * (single commit = one URL write) — used by the price
     * section's Go / Reset and single-select facets.
     */
    const applyGroupValues = useCallback(
        (group, items) => {
            const nextState = new Map(filterState);
            if (items && items.length) {
                nextState.set(group, new Set(items));
            } else {
                nextState.delete(group);
            }
            filterApi.setItems(nextState);
            setIsApplying(true);
        },
        [filterState, filterApi],
    );

    const handleKeyDownActions = useCallback(
        event => {
            // do not handle keyboard actions when the modal is closed
            if (!isOpen) {
                return;
            }

            switch (event.keyCode) {
                // when "Esc" key fired -> close the modal
                case 27:
                    handleClose();
                    break;
            }
        },
        [isOpen, handleClose],
    );

    useEffect(() => {
        const justOpened = prevDrawer.current === null && drawer === DRAWER_NAME;
        const justClosed = prevDrawer.current === DRAWER_NAME && drawer === null;

        // on drawer toggle, read filter state from location
        if (justOpened || justClosed) {
            const nextState = getStateFromSearch(search, filterKeys, filterItems);

            filterApi.setItems(nextState);
        }

        // on drawer close, update the modal visibility state
        if (justClosed) {
            handleClose();
        }

        prevDrawer.current = drawer;
    }, [drawer, filterApi, filterItems, filterKeys, search, handleClose]);

    useEffect(() => {
        const nextState = getStateFromSearch(search, filterKeys, filterItems);

        filterApi.setItems(nextState);
    }, [filterApi, filterItems, filterKeys, search]);

    return {
        filterApi,
        filterItems,
        filterKeys,
        filterNames,
        filterState,
        appliedFilterCount: countAppliedFromUrl(search),
        applyGroupValues,
        handleApply,
        handleClose,
        handleKeyDownActions,
        handleOpen,
        handleReset,
        isApplying,
        isOpen,
    };
};
