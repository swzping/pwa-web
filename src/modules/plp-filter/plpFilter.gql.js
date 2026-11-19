import { gql } from '@apollo/client';

/**
 * Lightweight total-count preview used by the H5 filter
 * sheet's "Apply (N items)" button — same filter payload
 * the apply will send, no product fields.
 */
export const GET_PRODUCTS_TOTAL_COUNT = gql`
    query PreviewProductsTotalCount($filters: ProductAttributeFilterInput, $search: String) {
        products(filter: $filters, search: $search) {
            total_count
        }
    }
`;

/**
 * GUID filter bootstrap (app parity: product_list services
 * GET_GUID_FILTER_BOOTSTRAP): Admin-configured quick-filter
 * settings + the category facet for the page context. Pass
 * the numeric category id on Category pages (facet = its
 * children); omit it on Search / root PLP to get the store's
 * L1 categories. Empty facet list on a Category page means
 * the node has no children -> the Category section is hidden.
 */
export const GET_GUID_FILTER_BOOTSTRAP = gql`
    query GuidFilterBootstrap($categoryId: Int) {
        guidQuickFilterSettings {
            code
            label
            attribute_code
            condition_type
            value
            requires_option_selection
        }
        guidCategoryFacet(category_id: $categoryId) {
            id
            uid
            name
            url_key
        }
    }
`;

export default {
    GET_PRODUCTS_TOTAL_COUNT,
    GET_GUID_FILTER_BOOTSTRAP,
};
