import { useQuery } from '@apollo/client';

import { GET_GUID_FILTER_BOOTSTRAP } from './plpFilter.gql';

/**
 * Normalize a category reference to the numeric entity id
 * guidCategoryFacet expects ($categoryId: Int). The
 * Category root component only has the router's base64 uid
 * (Magento encodes the id: "MjUz" -> "253"), and the
 * GraphQL Int type rejects that string outright — decode
 * when the value is not already numeric, so future callers
 * can pass either form. Undecodable values collapse to
 * undefined (backend then returns the store's L1 list).
 */
export const asNumericCategoryId = value => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const direct = Number(value);
    if (Number.isFinite(direct)) {
        return direct;
    }
    try {
        const numeric = Number(window.atob(String(value)));
        return Number.isFinite(numeric) ? numeric : undefined;
    } catch (error) {
        return undefined;
    }
};

/**
 * GuidFilterBootstrap wiring (app parity: product_list
 * GET_GUID_FILTER_BOOTSTRAP, fetched no-cache): the
 * Admin-configured quick-filter chip settings plus the
 * category facet for the page context. Pass the numeric
 * category id (a base64 uid is accepted and decoded) on
 * Category pages — the facet then holds the node's
 * children; omit it on Search / root PLP to get the
 * store's L1 categories.
 *
 * @param {number|string} [props.categoryId] numeric id or base64 uid
 * @returns {{
 *  quickFilterSettings: array|undefined,
 *  categoryFacet: array|undefined,
 *  bootstrapLoading: boolean,
 * }} settings/facet stay undefined while loading, so the
 * consumers fall back to legacy aggregation-driven behavior
 */
export const useGuidFilterBootstrap = ({ categoryId } = {}) => {
    const { data, loading } = useQuery(GET_GUID_FILTER_BOOTSTRAP, {
        variables: { categoryId: asNumericCategoryId(categoryId) || undefined },
        fetchPolicy: 'no-cache',
    });

    return {
        quickFilterSettings: data?.guidQuickFilterSettings,
        categoryFacet: data?.guidCategoryFacet,
        bootstrapLoading: loading,
    };
};

export default useGuidFilterBootstrap;
