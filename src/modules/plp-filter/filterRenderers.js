/**
 * ---------------------------------------------------- *
 * Pure renderer-resolution helpers for the PLP filter
 * panel (H5 bottom sheet + desktop sidebar). Ported from
 * the app-guardian FilterAndSort implementation.
 * Intentionally import-free so the module can be
 * unit-tested headless.
 * ---------------------------------------------------- *
 */

export const RENDERER = {
    PRICE: 'price',
    BOOLEAN: 'boolean',
    SEARCHABLE_CHIPS: 'searchableChips',
    CHIPS: 'chips',
};

const CATEGORY_CODES = ['category_id', 'category_uid'];
const LONG_LIST_THRESHOLD = 8;

/**
 * attribute_code -> renderer, pinned regardless of the
 * options shape so backend option-count fluctuation
 * cannot flip a group's UI type
 */
const EXPLICIT_RENDERERS = {
    price: RENDERER.PRICE,
    category_uid: RENDERER.SEARCHABLE_CHIPS,
    brand: RENDERER.SEARCHABLE_CHIPS,
    is_flash_sale: RENDERER.BOOLEAN,
    halal_indicator: RENDERER.BOOLEAN,
    safe_for_pregnant: RENDERER.BOOLEAN,
    eco_friendly_product: RENDERER.BOOLEAN,
    promotion_group: RENDERER.CHIPS,
};

const isBooleanishOptions = options =>
    options?.length > 0 && options.length <= 2 && options.every(option => ['0', '1'].includes(String(option.value)));

/**
 * ---------------------------------------------------- *
 * @function resolveRendererType
 * @summary pick a section renderer from the aggregation:
 * explicit code config first, then heuristics so unknown
 * future codes (e.g. pregnancy_safe Yes/No) auto-adapt
 * ---------------------------------------------------- *
 */
export const resolveRendererType = aggregation => {
    const code = aggregation?.attribute_code;
    if (EXPLICIT_RENDERERS[code]) {
        return EXPLICIT_RENDERERS[code];
    }
    if (isBooleanishOptions(aggregation?.options)) {
        return RENDERER.BOOLEAN;
    }
    const count = aggregation?.options?.length || 0;
    return count > LONG_LIST_THRESHOLD ? RENDERER.SEARCHABLE_CHIPS : RENDERER.CHIPS;
};

/**
 * ---------------------------------------------------- *
 * @function isVisibleAggregation
 * @summary visibility only — depends on page context and
 * backend counts; deliberately separate from renderer
 * type. Category groups never appear in the generic
 * list: they are lifted into their own first section by
 * buildFilterSections
 * ---------------------------------------------------- *
 */
export const isVisibleAggregation = aggregation => {
    return (
        !!aggregation &&
        aggregation.count !== 0 &&
        !CATEGORY_CODES.includes(aggregation.attribute_code) &&
        (aggregation.options?.length || 0) > 0
    );
};

const SINGLE_SELECT_CODES = ['promotion_group'];

/**
 * ---------------------------------------------------- *
 * @function isSingleSelectAggregation
 * @summary facets where picking one option replaces the
 * previous one instead of accumulating (PRD: Promotion
 * facet is single-select)
 * ---------------------------------------------------- *
 */
export const isSingleSelectAggregation = aggregation => SINGLE_SELECT_CODES.includes(aggregation?.attribute_code);

export const PRICE_BOUNDS_FALLBACK = { min: 0, max: 1000000 };

/**
 * ---------------------------------------------------- *
 * @function getPriceBounds
 * @summary slider bounds for a LINEAR track: lower edge
 * pinned to 0, upper edge from the price buckets
 * ("min_max" option values) capped at the fallback max —
 * buckets can span tens of millions while nearly all
 * products sit within the first million, and an uncapped
 * track makes drag granularity unusable. Malformed or
 * missing options fall back to the default range
 * ---------------------------------------------------- *
 */
export const getPriceBounds = (aggregation, fallback = PRICE_BOUNDS_FALLBACK) => {
    const edges = [];
    (aggregation?.options || []).forEach(option => {
        const [lo, hi] = String(option?.value || '').split('_');
        const loN = Number(lo);
        const hiN = Number(hi);
        if (Number.isFinite(loN)) {
            edges.push(loN);
        }
        if (Number.isFinite(hiN)) {
            edges.push(hiN);
        }
    });
    if (!edges.length) {
        return fallback;
    }
    return { min: 0, max: Math.min(Math.max(...edges), fallback.max) };
};

/**
 * ---------------------------------------------------- *
 * @function parseDraftPrice
 * @summary draft values (["300_60000"] | []) -> slider /
 * input range; an empty draft reads as the full bounds
 * ---------------------------------------------------- *
 */
export const parseDraftPrice = (draftValues, bounds) => {
    if (!draftValues?.length) {
        return [bounds.min, bounds.max];
    }
    const [lo, hi] = String(draftValues[0])
        .split('_')
        .map(Number);
    return [Number.isFinite(lo) ? lo : bounds.min, Number.isFinite(hi) ? hi : bounds.max];
};

/**
 * ---------------------------------------------------- *
 * @function draftPriceFromRange
 * @summary slider range -> draft values; a range covering
 * the full bounds means "no filter" and clears the draft
 * ---------------------------------------------------- *
 */
export const draftPriceFromRange = (range, bounds) => {
    const [lo, hi] = range;
    return lo <= bounds.min && hi >= bounds.max ? [] : [`${lo}_${hi}`];
};

/**
 * ---------------------------------------------------- *
 * @function buildFilterSections
 * @summary section metadata for the filter panel, in the
 * exact order the aggregations come back from the backend
 * (the Category facet keeps the position of the
 * category_uid aggregation — from that aggregation on
 * category pages, or from the flagged bootstrap facet,
 * which also renders on Search; always only when it
 * carries options). Rendering uses the {title,
 * value} items from filterItems — only metadata lives here
 * ---------------------------------------------------- *
 */
export const buildFilterSections = (aggregations, { isSearch = false, categoryLabel = 'Category' } = {}) => {
    const list = Array.isArray(aggregations) ? aggregations : [];
    const sections = [];
    let categorySection = null;

    list.forEach(aggregation => {
        const code = aggregation?.attribute_code;
        if (!code) {
            return;
        }
        if (CATEGORY_CODES.includes(code)) {
            // an isCategoryFacet aggregation (GuidFilterBootstrap's
            // guidCategoryFacet, normalized) also renders on Search —
            // app parity: Search shows the store's L1 categories
            if (
                !categorySection &&
                code === 'category_uid' &&
                (aggregation.options?.length || 0) > 0 &&
                (!isSearch || aggregation.isCategoryFacet)
            ) {
                categorySection = {
                    attribute_code: code,
                    label: categoryLabel,
                    rendererType: RENDERER.SEARCHABLE_CHIPS,
                    isCategory: true,
                    singleSelect: false,
                };
                sections.push(categorySection);
            }
            return;
        }
        if (!isVisibleAggregation(aggregation, { isSearch })) {
            return;
        }
        const rendererType = resolveRendererType(aggregation, { isSearch });
        sections.push({
            attribute_code: code,
            label: aggregation.label || '',
            rendererType,
            isCategory: false,
            singleSelect: isSingleSelectAggregation(aggregation),
            priceBounds: rendererType === RENDERER.PRICE ? getPriceBounds(aggregation) : undefined,
        });
    });

    return sections;
};

/**
 * ---------------------------------------------------- *
 * @function applyCategoryFacet
 * @param {array} aggregations initial page aggregations
 * @param {array} categoryFacet guidCategoryFacet response
 * — [{id, uid, name, url_key}] for the page context
 * @summary rebuild the Category group from the GuidFilter
 * bootstrap facet instead of the category_uid aggregation
 * (app parity: FilterAndSort normalizes categorySection the
 * same way). An undefined facet (query absent or still
 * loading) keeps legacy aggregation-driven behavior; an
 * empty facet on a category page means the node has no
 * children — the Category section is hidden; otherwise a
 * synthetic aggregation takes the category aggregation's
 * position (or the end when the page has no category
 * aggregation — app parity: never pinned to the front) and
 * is flagged isCategoryFacet so buildFilterSections also
 * renders it on Search
 * ---------------------------------------------------- *
 */
export const applyCategoryFacet = (aggregations, categoryFacet) => {
    if (!Array.isArray(aggregations) || !Array.isArray(categoryFacet)) {
        return aggregations;
    }
    if (!categoryFacet.length) {
        // node without children -> hide the Category section
        return aggregations.filter(aggregation => !CATEGORY_CODES.includes(aggregation?.attribute_code));
    }
    const synthetic = {
        attribute_code: 'category_uid',
        label: '',
        count: categoryFacet.length,
        options: categoryFacet.map(category => ({ label: (category && category.name) || '', value: category?.uid })),
        isCategoryFacet: true,
    };
    const firstCategoryIndex = aggregations.findIndex(aggregation =>
        CATEGORY_CODES.includes(aggregation?.attribute_code),
    );
    if (firstCategoryIndex === -1) {
        return [...aggregations, synthetic];
    }
    return [...aggregations.slice(0, firstCategoryIndex), synthetic, ...aggregations.slice(firstCategoryIndex + 1)];
};

/**
 * ---------------------------------------------------- *
 * @function resolveQuickFilterChips
 * @param {array} quickFilterSettings guidQuickFilterSettings
 * response — Admin-configured {code, label, attribute_code,
 * condition_type, value, requires_option_selection} objects
 * @param {array} aggregations initial page aggregations
 * @summary intersect Admin-enabled settings with the page's
 * aggregation snapshot — a chip with no matching facet or
 * zero matching products is hidden. Toggleable chips carry
 * {attributeCode, value} from the settings;
 * requires_option_selection chips open the filter panel
 * for the user to pick option(s) instead of toggling a
 * fixed value. Admin label wins over the facet label
 * ---------------------------------------------------- *
 */
const DISCOUNT_QUICK_CHIP_CODE = 'discount_percentage';
const PROMOTION_GROUP_CODE = 'promotion_group';

/**
 * discount_percentage has no facet of its own — the quick
 * chip shows only when this page's promotion_group facet
 * carries a "Discount" option with products (case-insensitive
 * contains, so label drift like "Discount 10%" keeps the chip)
 */
const hasDiscountPromoOption = aggregations => {
    const promotion = (aggregations || []).find(aggregation => aggregation?.attribute_code === PROMOTION_GROUP_CODE);
    return (promotion?.options || []).some(
        option =>
            Number(option?.count) > 0 &&
            String(option?.label || '')
                .toLowerCase()
                .includes('discount'),
    );
};

export const resolveQuickFilterChips = (quickFilterSettings, aggregations) => {
    const settings = Array.isArray(quickFilterSettings) ? quickFilterSettings : [];
    const aggregationByCode = (aggregations || []).reduce((acc, aggregation) => {
        if (aggregation?.attribute_code) {
            acc[aggregation.attribute_code] = aggregation;
        }
        return acc;
    }, {});
    const chips = [];
    settings.forEach(setting => {
        if (setting?.attribute_code === DISCOUNT_QUICK_CHIP_CODE) {
            // gated on the promotion_group facet, not on its own
            // (absent) facet; label/value come straight from Admin
            if (!hasDiscountPromoOption(aggregations) || !setting.value) {
                return;
            }
            chips.push({
                code: setting.code,
                attributeCode: setting.attribute_code,
                value: setting.value,
                label: setting.label,
                opensPanel: false,
            });
            return;
        }
        const aggregation = aggregationByCode[(setting?.attribute_code)];
        if (!aggregation || aggregation.count === 0) {
            return;
        }
        const label = setting.label || aggregation.label;
        if (setting.requires_option_selection) {
            chips.push({ code: setting.code, label, opensPanel: true });
            return;
        }
        if ((aggregation.options?.length || 0) === 0 || !setting.value) {
            return;
        }
        chips.push({
            code: setting.code,
            attributeCode: setting.attribute_code,
            value: setting.value,
            label,
            opensPanel: false,
        });
    });
    return chips;
};

/**
 * ---------------------------------------------------- *
 * @function resolveFallbackQuickFilterChips
 * @summary fallback used while the web backend does not
 * expose guidQuickFilterSettings (app parity): one
 * instant-toggle chip per visible boolean-renderer
 * aggregation, carrying value '1'
 * ---------------------------------------------------- *
 */
export const resolveFallbackQuickFilterChips = aggregations => {
    const list = Array.isArray(aggregations) ? aggregations : [];
    return list
        .filter(
            aggregation => isVisibleAggregation(aggregation) && resolveRendererType(aggregation) === RENDERER.BOOLEAN,
        )
        .map(aggregation => ({
            code: aggregation.attribute_code,
            attributeCode: aggregation.attribute_code,
            value: '1',
            label: aggregation.label,
            opensPanel: false,
        }));
};
