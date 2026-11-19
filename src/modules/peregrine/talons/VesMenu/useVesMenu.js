import { useQuery } from '@apollo/client';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import DEFAULT_OPERATIONS from './vesMenu.gql';

/**
 * The useVesMenu talon complements the VesMenu component.
 *
 * @param {Object} props
 * @param {*} props.operations GraphQL operations used by talons
 *
 * @return {VesMenuTalonProps}
 */
export const useVesMenu = (props = {}) => {
    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);
    const { getVesMenuQuery } = operations;

    const location = useLocation();
    const [activeCategoryId, setActiveCategoryId] = useState(null);

    const { data } = useQuery(getVesMenuQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        variables: {
            alias: process.env.VESMENU_ALIAS
        },
        skip: location.pathname === '/checkout'
    });

    const getUrlPath = link => {
        if (link) {
            const baseURLPattern = /^.+?[^\/:](?=[?\/]|$)\//gm;
            return link.replace(baseURLPattern, '');
        }
        return '';
    };

    /**
     * Check if category should be visible on the storefront.
     *
     * @param {VesMenuCategory} category
     * @returns {boolean}
     */
    const shouldRenderVesMenuItem = category => {
        return true;
    };

    /**
     * Check if category is the active category based on the current location.
     *
     * @param {VesMenuCategory} category
     * @returns {boolean}
     */
    const isActive = useCallback(
        ({ link }) => {
            return location.pathname === `/${getUrlPath(link)}`;
        },
        [location.pathname]
    );

    /**
     * Recursively map data returned by GraphQL query.
     *
     * @param {VesMenuCategory} category
     * @param {array} - path from the given category to the first level category
     * @param {boolean} isRoot - describes is category a root category
     * @return {VesMenuCategory}
     */
    const processData = useCallback(
        (category, path = [], isRoot = true) => {
            if (!category) {
                return;
            }

            const vesMenuCategory = Object.assign({}, category);

            if (!isRoot) {
                vesMenuCategory.path = [...path, category.id];
            }

            vesMenuCategory.isActive = isActive(vesMenuCategory);
            vesMenuCategory.include_in_menu = 1;
            vesMenuCategory.position = vesMenuCategory.id;
            vesMenuCategory.url_path = getUrlPath(vesMenuCategory.link);

            if (vesMenuCategory.children) {
                vesMenuCategory.children = [...vesMenuCategory.children]
                    .filter(category => shouldRenderVesMenuItem(category))
                    .map(child =>
                        processData(
                            child,
                            vesMenuCategory.url_path.split('/'),
                            false
                        )
                    );
            }

            return vesMenuCategory;
        },
        [isActive]
    );

    const vesMenuData = useMemo(() => {
        let vesMenuData = {};

        if (data) {
            vesMenuData = { ...data.vesMenu };
            vesMenuData.link = '';
            vesMenuData.children = [...data.vesMenu.items];

            return processData(vesMenuData);
        }

        return {};
    }, [data, processData]);

    // const findActiveCategory = useCallback(
    //     (pathname, category) => {
    //         if (isActive(category)) {
    //             return category;
    //         }

    //         if (category.children) {
    //             return category.children.find(category =>
    //                 findActiveCategory(pathname, category)
    //             );
    //         }
    //     },
    //     [isActive]
    // );

    // useEffect(() => {
    //     const activeCategory = findActiveCategory(
    //         location.pathname,
    //         vesMenuData
    //     );

    //     if (activeCategory) {
    //         setActiveCategoryId(activeCategory.path[0]);
    //     } else {
    //         setActiveCategoryId(null);
    //     }
    // }, [findActiveCategory, location.pathname, vesMenuData]);

    return {
        vesMenuData,
        activeCategoryId
    };
};

/** JSDocs type definitions */

/**
 * @typedef {Object} VesMenuTalonProps
 *
 * @property {VesMenuCategory} vesMenuData - The Object with categories contains only categories
 *                                             with the include_in_menu = 1 flag. The categories are sorted
 *                                             based on the field position.
 * @property {int} loading whether the regions are loading
 *
 */

/**
 * Object type returned by the {@link useVesMenu} talon.
 * @typedef {Object} VesMenuCategory
 *
 * @property {int} id - id of the category
 * @property {int} include_in_menu - describes if category should be included in menu
 * @property {String} name - name of the category
 * @property {int} position - value used for sorting
 * @property {String} url_path - URL path for a category
 * @property {String} url_suffix - URL Suffix for the category
 * @property {VesMenuCategory} children - child category
 */
