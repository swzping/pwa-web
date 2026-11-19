import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { useHistory, useLocation } from 'react-router-dom';

import { useAppContext } from '@magento/peregrine/lib/context/app';

import { useFilterState } from '@magento/peregrine/lib/talons/FilterModal/useFilterState';

import { getSearchFromState, getStateFromSearch, stripHtml } from '@magento/peregrine/lib/talons/FilterModal/helpers';

import {
    buildProductFilterInput,
    categorySelectionsFromRawMap,
    countAppliedFromUrl,
    stateToRawFilterStrings,
    supplementItemsFromUrl,
} from '../../../../modules/plp-filter/filterPayload';
import { GET_PRODUCTS_TOTAL_COUNT } from '../../../../modules/plp-filter/plpFilter.gql';

const DRAWER_NAME = 'filter';
const DRAFT_COUNT_DEBOUNCE_MS = 500;

/**
 * Filter Modal talon (H5 bottom sheet).
 *
 * The applied state is the URL; the sheet edits a draft
 * copy that only lands in the URL when the user presses
 * Apply (abandoned edits are discarded). Also owns the
 * debounced total-count preview for the "Apply (N items)"
 * footer button.
 *
 * @returns {{
 *   filterApi: any,
 *   filterState: any,
 *   draftState: any,
 *   draftApi: any,
 *   draftFilterCount: number|null,
 *   isDraftCountLoading: boolean,
 *   handleClose: function,
 *   isOpen: boolean
 * }}
 */
export const useFilterModal = props => {
    const { filters } = props;

    // primitives only — an inline pageContext object in the
    // caller would re-trigger the count effect every render
    const { categoryId, searchTerm } = props.pageContext || {};

    const [isApplying, setIsApplying] = useState(false);
    const [{ drawer }, { toggleDrawer, closeDrawer }] = useAppContext();
    const [filterState, filterApi] = useFilterState();
    const [draftState, draftApi] = useFilterState();
    const prevDrawer = useRef(null);
    const isOpen = drawer === DRAWER_NAME;

    const client = useApolloClient();
    const [draftFilterCount, setDraftFilterCount] = useState(null);
    const [isDraftCountLoading, setIsDraftCountLoading] = useState(false);
    const countRequestRef = useRef(0);

    const history = useHistory();
    const { pathname, search } = useLocation();

    // iterate over filters once to set up all the collections we need.
    // Category groups stay enabled: the panel renders them as their
    // own first section, and their URL params must survive
    // getSearchFromState rewrites. URL values that are not
    // aggregation options (custom price ranges) are supplemented so
    // they round-trip instead of being silently dropped
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

    // on apply, write the draft filter state to location
    useEffect(() => {
        if (isApplying) {
            const nextSearch = getSearchFromState(search, filterKeys, draftState);

            // write filter state to history
            history.push({ pathname, search: nextSearch });

            // mark the operation as complete
            setIsApplying(false);
        }
    }, [filterKeys, draftState, history, isApplying, pathname, search]);

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

    // draft-only clear: the user still presses Apply to commit
    // (app parity — clearDraftFilters)
    const handleReset = useCallback(() => {
        draftApi.clear();
        setDraftFilterCount(null);
    }, [draftApi]);

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

            if (justOpened) {
                // fresh draft from the applied state — same item
                // references, so identity-based checks keep working
                draftApi.setItems(nextState);
                setDraftFilterCount(null);
            }
        }

        // on drawer close, update the modal visibility state
        if (justClosed) {
            handleClose();
        }

        prevDrawer.current = drawer;
    }, [drawer, filterApi, draftApi, filterItems, filterKeys, search, handleClose]);

    // debounced total-count preview for the Apply button — runs
    // only while the sheet is open, guarded against out-of-order
    // responses, silent on failure (button degrades to "Apply")
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const requestId = ++countRequestRef.current;
        setIsDraftCountLoading(true);
        const timer = setTimeout(async () => {
            try {
                const rawDraft = stateToRawFilterStrings(draftState);
                const filterInput = buildProductFilterInput(rawDraft);
                const categorySelection = categorySelectionsFromRawMap(rawDraft);
                if (categorySelection) {
                    filterInput[categorySelection.code] = {
                        in: categorySelection.values,
                    };
                } else if (categoryId) {
                    filterInput.category_uid = { eq: categoryId };
                }

                const { data } = await client.query({
                    query: GET_PRODUCTS_TOTAL_COUNT,
                    variables: {
                        filters: filterInput,
                        search: searchTerm || null,
                    },
                    fetchPolicy: 'no-cache',
                });

                if (countRequestRef.current !== requestId) {
                    return; // a newer draft superseded this response
                }
                const totalCount = data?.products?.total_count;
                setDraftFilterCount(totalCount != null ? totalCount : null);
            } catch {
                if (countRequestRef.current === requestId) {
                    setDraftFilterCount(null);
                }
            } finally {
                if (countRequestRef.current === requestId) {
                    setIsDraftCountLoading(false);
                }
            }
        }, DRAFT_COUNT_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [draftState, isOpen, client, categoryId, searchTerm]);

    return {
        filterApi,
        filterItems,
        filterKeys,
        filterNames,
        filterState,
        draftState,
        draftApi,
        draftFilterCount,
        draftAppliedCount: countAppliedFromUrl(search),
        isDraftCountLoading,
        handleApply,
        handleClose,
        handleKeyDownActions,
        handleOpen,
        handleReset,
        isApplying,
        isOpen,
    };
};
