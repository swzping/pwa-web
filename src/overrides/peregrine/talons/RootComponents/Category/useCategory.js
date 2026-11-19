import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLazyQuery, useQuery } from '@apollo/client';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import { useAppContext } from '@magento/peregrine/lib/context/app';
import { usePagination } from '@magento/peregrine/lib/hooks/usePagination';
import { useScrollTopOnChange } from '@magento/peregrine/lib/hooks/useScrollTopOnChange';
import { useSort } from '@magento/peregrine/lib/hooks/useSort';
import {
    getFiltersFromSearch,
    getFilterInput
} from '@magento/peregrine/lib/talons/FilterModal/helpers';

import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/RootComponents/Category/category.gql';

import {
    buildPriceEnvelope,
    categorySelectionsFromRawMap,
    valueFromFilterString
} from '../../../../../modules/plp-filter/filterPayload';
import { resolveSortParam } from '../../../../../modules/plp-filter/sortOptions';

import { impressionTracking } from '../../../../../lib/ThirdPartyTracking';
import useSwitcher from '../../../../../modules/peregrine/hooks/useSwitcher';
import {
    LAYOUT_SWITCHER_DEFAULT_VALUE,
    LAYOUT_SWITCHER_OPTIONS
} from '../../../../../modules/swift-pwa-ui/components/LayoutSwitcher';

/**
 * A [React Hook]{@link https://reactjs.org/docs/hooks-intro.html} that
 * controls the logic for the Category Root Component.
 *
 * @kind function
 *
 * @param {object}      props
 * @param {String}      props.id - Category uid.
 * @param {GraphQLAST}  props.operations.getCategoryQuery - Fetches category using a server query
 * @param {GraphQLAST}  props.operations.getFilterInputsQuery - Fetches "allowed" filters using a server query
 * @param {GraphQLAST}  props.queries.getStoreConfig - Fetches store configuration using a server query
 *
 * @returns {object}    result
 * @returns {object}    result.error - Indicates a network error occurred.
 * @returns {object}    result.categoryData - Category data.
 * @returns {bool}      result.isLoading - Category data loading.
 * @returns {string}    result.metaDescription - Category meta description.
 * @returns {object}    result.pageControl - Category pagination state.
 * @returns {array}     result.sortProps - Category sorting parameters.
 * @returns {number}    result.pageSize - Category total pages.
 */
export const useCategory = props => {
    const {
        id,
        queries: { getPageSize }
    } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getCategoryQuery, getFilterInputsQuery } = operations;

    const { data: pageSizeData } = useQuery(getPageSize, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const pageSize = 12;
    const [pageSizeCategory, setPageSizeCategory] = useState(pageSize);
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const [paginationValues, paginationApi] = usePagination();
    const { currentPage, totalPages } = paginationValues;
    const { setCurrentPage, setTotalPages } = paginationApi;

    const sortProps = useSort();
    const [currentSort] = sortProps;

    const {
        stateProps: layoutSwitcherProps,
        options: layoutSwitcherOptions
    } = useSwitcher({
        initialValue: LAYOUT_SWITCHER_DEFAULT_VALUE,
        options: LAYOUT_SWITCHER_OPTIONS,
    });

    // Keep track of the sort criteria so we can tell when they change.
    const previousSort = useRef(currentSort);

    const resizePhone = () => {
        window.onresize = function () {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    const pageControl = {
        currentPage,
        setPage: setCurrentPage,
        totalPages
    };

    const [
        ,
        {
            actions: { setPageLoading }
        }
    ] = useAppContext();

    const [runQuery, queryResponse] = useLazyQuery(getCategoryQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });
    const {
        called: categoryCalled,
        loading: categoryLoading,
        error,
        data
    } = queryResponse;
    const { search, pathname } = useLocation();

    const categoryRelativePath = pathname.replace('.html', '')
        .replace(/^\//g, '')
        .replace('/', ' > ');
    const isBackgroundLoading = !!data && categoryLoading;

    // Update the page indicator if the GraphQL query is in flight.
    useEffect(() => {
        setPageLoading(isBackgroundLoading);
    }, [isBackgroundLoading, setPageLoading]);

    // Keep track of the search terms so we can tell when they change.
    const previousSearch = useRef(search);

    // Get "allowed" filters by intersection of schema and aggregations
    // const {
    //     called: introspectionCalled,
    //     data: introspectionData,
    //     loading: introspectionLoading
    // } = useQuery(getFilterInputsQuery, {
    //     fetchPolicy: 'cache-and-network',
    //     nextFetchPolicy: 'cache-first'
    // });

    // Create a type map we can reference later to ensure we pass valid args
    // to the graphql query.
    // For example: { category_id: 'FilterEqualTypeInput', price: 'FilterRangeTypeInput' }
    // const filterTypeMap = useMemo(() => {
    //     const typeMap = new Map();
    //     if (introspectionData) {
    //         introspectionData.__type.inputFields.forEach(({ name, type }) => {
    //             typeMap.set(name, type.name);
    //         });
    //     }
    //     return typeMap;
    // }, [introspectionData]);

    // Run the category query immediately and whenever its variable values change.
    useEffect(() => {
        // Wait until we have the type map to fetch product data.
        if (!pageSize) {
            return;
        }

        const filters = getFiltersFromSearch(search);
        // Construct the filter arg object.
        const newFilters = {};
        filters.forEach((values, key) => {
            // Category selections are resolved below against the
            // page base — they are mutually exclusive with it.
            if (key === 'category_id' || key === 'category_uid') {
                return;
            }
            // All selected price values collapse to one {from, to}
            // envelope covering the numeric min/max (app parity)
            if (key === 'price') {
                const envelope = buildPriceEnvelope(values);
                if (envelope) {
                    newFilters[key] = envelope;
                }
            } else if (['name', 'promo', 'short_description'].includes(key)) {
                newFilters[key] = getFilterInput(values, 'FilterMatchTypeInput');
            } else if (key === 'discount_percentage') {
                // app parity: "Has Discount" is an open-ended
                // positive-discount filter
                newFilters[key] = {
                    from: valueFromFilterString(Array.from(values)[0])
                };
            } else {
                // facet attributes submit as {in: [...]} — single-
                // and multi-value selections alike (app parity)
                newFilters[key] = getFilterInput(values, 'FilterEqualTypeInput');
            }
        });

        // Selected subcategories replace the page base: facet
        // values are children of the current category so results
        // stay in scope; ProductAttributeFilterInput rejects
        // category_id + category_uid together.
        const categorySelection = categorySelectionsFromRawMap(filters);
        if (categorySelection) {
            newFilters[categorySelection.code] = { in: categorySelection.values };
        } else {
            newFilters['category_uid'] = { eq: id };
        }

        runQuery({
            variables: {
                currentPage: Number(currentPage),
                id: id,
                filters: newFilters,
                pageSize: Number(isPhone ? pageSizeCategory : pageSize),
                sort: {
                    ...resolveSortParam(currentSort, false),
                    stock_status: 'DESC'
                }
            }
        });
    }, [
        currentPage,
        currentSort,
        // filterTypeMap,
        id,
        pageSize,
        runQuery,
        search,
        pageSizeCategory,
    ]);

    const totalPagesFromData = data
        ? data.products?.page_info?.total_pages
        : null;

    useEffect(() => {
        setTotalPages(totalPagesFromData);
        return () => {
            setTotalPages(null);
        };
    }, [setTotalPages, totalPagesFromData]);

    // If we get an error after loading we should try to reset to page 1.
    // If we continue to have errors after that, render an error message.
    useEffect(() => {
        if (error && !categoryLoading && !data && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [currentPage, error, categoryLoading, setCurrentPage, data]);

    // Reset the current page back to one (1) when the search string, filters
    // or sort criteria change.
    useEffect(() => {
        // We don't want to compare page value.
        const prevSearch = new URLSearchParams(previousSearch.current);
        const nextSearch = new URLSearchParams(search);
        prevSearch.delete('page');
        nextSearch.delete('page');

        if (
            prevSearch.toString() !== nextSearch.toString() ||
            String(previousSort.current.sortAttribute) !==
            String(currentSort.sortAttribute) ||
            String(previousSort.current.sortDirection) !==
            String(currentSort.sortDirection)
        ) {
            // The search term changed.
            setCurrentPage(1, true);
            // And update the ref.
            previousSearch.current = search;
            previousSort.current = currentSort;
        }
    }, [currentSort, previousSearch, search, setCurrentPage]);

    const categoryData = categoryLoading && !data ? null : data;
    const metaDescription =
        data && data.category && data.category.meta_description
            ? data.category.meta_description
            : '';

    useEffect(() => {
        let currency = 'IDR';
        let productImpressions = [];

        if (categoryData && categoryData.products && categoryData.products.items) {
            if (categoryData.products.items.length > 0) {
                currency = categoryData.products.items[0].price_range.maximum_price.regular_price.currency;
            }

            productImpressions = categoryData.products.items.map((item) => ({
                ...item,
                price_range: {
                    minimum_price: {
                        regular_price: {
                            ...item.price_range.maximum_price.regular_price,
                        }
                    }
                }
            }));
        }

        impressionTracking(productImpressions, categoryRelativePath, currency);
    }, [categoryData]);

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    // When only categoryLoading is involved, noProductsFound component flashes for a moment
    const loading = !categoryCalled || (categoryLoading && !data)

    useScrollTopOnChange(currentPage);

    const loadMoreCategory = () => {
        if (categoryData) {
            const { current_page, total_pages } = categoryData.products?.page_info;

            if (current_page < total_pages && isPhone) {
                setPageSizeCategory(current => current + pageSize);
            } else {
                setPageSizeCategory(pageSize);
            }
        }
    };

    return {
        error,
        categoryRelativePath,
        categoryData,
        loading,
        isBackgroundLoading,
        loadMoreCategory,
        metaDescription,
        pageControl,
        sortProps,
        layoutSwitcherProps,
        layoutSwitcherOptions,
        pageSize,
        pageSizeCategory,
        isPhone
    };
};
