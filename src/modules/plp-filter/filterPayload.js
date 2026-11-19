/**
 * ---------------------------------------------------- *
 * Bridge between the URL filter params, the filter state
 * maps and the Magento ProductAttributeFilterInput.
 * Ported from the app-guardian useProductListFilter
 * payload semantics, adapted to the pwa URL format
 * (`code[filter]=title,value`).
 * ---------------------------------------------------- *
 */

import { DELIMITER, getFiltersFromSearch } from '@magento/peregrine/lib/talons/FilterModal/helpers';

const CATEGORY_CODES = ['category_id', 'category_uid'];
const MATCH_KEYS = ['name', 'promo', 'short_description'];
const DISCOUNT_KEY = 'discount_percentage';

/**
 * value part of a raw `title,value` URL filter string
 */
export const valueFromFilterString = keyValueString => keyValueString.split(DELIMITER)[1];

/**
 * title part of a raw `title,value` URL filter string
 */
export const titleFromFilterString = keyValueString => {
    const index = keyValueString.indexOf(DELIMITER);
    return index >= 0 ? keyValueString.slice(0, index) : keyValueString;
};

/**
 * ---------------------------------------------------- *
 * @function stateToRawFilterStrings
 * @summary Map<code, Set<{title,value}>> ->
 * Map<code, Set<'title,value'>> — the raw shape that
 * getFiltersFromSearch produces and the query talons
 * consume
 * ---------------------------------------------------- *
 */
export const stateToRawFilterStrings = stateMap => {
    const raw = new Map();
    (stateMap || []).forEach((items, code) => {
        const values = new Set();
        items.forEach(item => {
            values.add(`${item?.title != null ? item.title : ''}${DELIMITER}${item?.value != null ? item.value : ''}`);
        });
        raw.set(code, values);
    });
    return raw;
};

/**
 * ---------------------------------------------------- *
 * @function buildPriceEnvelope
 * @summary Set of raw price strings -> one {from, to}
 * envelope covering every selected "lo_hi" value
 * (app parity: multiple buckets collapse to a single
 * numeric min/max range)
 * ---------------------------------------------------- *
 */
export const buildPriceEnvelope = rawValues => {
    const numbers = [];
    Array.from(rawValues || []).forEach(raw => {
        const value = valueFromFilterString(String(raw));
        const [lo, hi] = value.split('_');
        const loN = Number(lo);
        const hiN = Number(hi);
        if (Number.isFinite(loN)) {
            numbers.push(loN);
        }
        if (Number.isFinite(hiN)) {
            numbers.push(hiN);
        }
    });
    if (!numbers.length) {
        return null;
    }
    return {
        from: String(Math.min(...numbers)),
        to: String(Math.max(...numbers)),
    };
};

/**
 * ---------------------------------------------------- *
 * @function buildProductFilterInput
 * @summary raw filter map -> ProductAttributeFilterInput
 * (app buildFilterPayload semantics): price -> envelope,
 * discount_percentage -> open-ended {from}, text search
 * keys -> {match}, everything else -> {in: [...]} for
 * single- and multi-value selections alike. Category
 * codes are excluded — the caller resolves them against
 * the page base (mutual exclusion)
 * ---------------------------------------------------- *
 */
export const buildProductFilterInput = rawFiltersMap => {
    const filterInput = {};
    (rawFiltersMap || new Map()).forEach((values, key) => {
        if (CATEGORY_CODES.includes(key)) {
            return;
        }
        const list = Array.from(values || []);
        if (!list.length) {
            return;
        }
        if (key === 'price') {
            const envelope = buildPriceEnvelope(values);
            if (envelope) {
                filterInput[key] = envelope;
            }
        } else if (key === DISCOUNT_KEY) {
            filterInput[key] = {
                from: valueFromFilterString(list[0]),
            };
        } else if (MATCH_KEYS.includes(key)) {
            filterInput[key] = {
                match: valueFromFilterString(list[0]),
            };
        } else {
            filterInput[key] = {
                in: list.map(valueFromFilterString),
            };
        }
    });
    return filterInput;
};

/**
 * ---------------------------------------------------- *
 * @function categorySelectionsFromRawMap
 * @summary explicit category facet selections from the
 * URL, if any. Mutually exclusive with the page base:
 * when present, the caller replaces the category_uid eq
 * with {in: [...]} (facet values are children of the
 * page node so results stay in scope)
 * ---------------------------------------------------- *
 */
export const categorySelectionsFromRawMap = rawFiltersMap => {
    for (const code of CATEGORY_CODES) {
        const values = rawFiltersMap?.get(code);
        if (values && values.size) {
            return {
                code,
                values: Array.from(values).map(valueFromFilterString),
            };
        }
    }
    return null;
};

/**
 * ---------------------------------------------------- *
 * @function countAppliedFromUrl
 * @summary total number of applied filter values in the
 * URL — the applied-state derived count used by the
 * mobile Filter button badge and the quick chips
 * ---------------------------------------------------- *
 */
export const countAppliedFromUrl = searchString => {
    let count = 0;
    getFiltersFromSearch(searchString).forEach(values => {
        count += values.size;
    });
    return count;
};

/**
 * ---------------------------------------------------- *
 * @function clearFiltersFromSearch
 * @summary URL search string with every `code[filter]`
 * param removed — the "Clear all filters" action of the
 * empty-results state (app parity: getClearedFilters
 * empties every group; sort is untouched — it is not
 * URL-encoded in this project). Mirrors
 * getSearchFromState's `?`-prefixed output so a
 * history.push keeps the established URL format
 * ---------------------------------------------------- *
 */
export const clearFiltersFromSearch = searchString => {
    const params = new URLSearchParams(searchString);
    for (const key of new Set(params.keys())) {
        if (key.endsWith('[filter]')) {
            params.delete(key);
        }
    }
    return `?${params.toString()}`;
};

/**
 * ---------------------------------------------------- *
 * @function supplementItemsFromUrl
 * @summary makes every URL `code[filter]` param fully
 * managed by the filter-state machinery. Two gaps are
 * covered:
 * 1. values missing from filterItems (custom values such
 *    as a typed price range are not aggregation options)
 *    get synthetic {title, value} items so they
 *    round-trip instead of being silently dropped by
 *    getStateFromSearch
 * 2. keys with no aggregation at all (quick-chip-only
 *    codes such as discount_percentage, or stale
 *    bookmarks) get the key adopted into filterKeys and
 *    a synthesized group — getSearchFromState deletes
 *    only keys it knows, so an unadopted key survives
 *    every Apply rewrite and Clear All could not clear
 *    it. Mutates the filterKeys set in place (callers
 *    pass their own locally-built Set) and returns the
 *    original map when nothing is missing so memo
 *    identity stays stable
 * ---------------------------------------------------- *
 */
export const supplementItemsFromUrl = (searchString, filterKeys, filterItems) => {
    const params = new URLSearchParams(searchString);
    const nextItems = new Map(filterItems);
    let changed = false;

    // URLSearchParams.keys() is an iterator — snapshot into a Set
    // (peregrine helpers.js idiom) instead of relying on forEach
    for (const key of new Set(params.keys())) {
        if (!key.endsWith('[filter]')) {
            continue;
        }
        const group = key.slice(0, -8);
        const existingItems = nextItems.get(group);
        if (!existingItems) {
            const synthesized = [];
            const seen = new Set();
            params.getAll(key).forEach(raw => {
                const value = valueFromFilterString(String(raw));
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
                synthesized.push({
                    title: titleFromFilterString(String(raw)),
                    value,
                });
            });
            nextItems.set(group, synthesized);
            filterKeys.add(key);
            changed = true;
            continue;
        }
        const items = existingItems.slice();
        const byValue = new Map(existingItems.map(item => [item.value, item]));
        let groupChanged = false;
        params.getAll(key).forEach(raw => {
            const value = valueFromFilterString(String(raw));
            if (byValue.has(value)) {
                return;
            }
            const item = {
                title: titleFromFilterString(String(raw)),
                value,
            };
            items.push(item);
            byValue.set(value, item);
            groupChanged = true;
        });
        if (groupChanged) {
            nextItems.set(group, items);
            changed = true;
        }
    }

    return changed ? nextItems : filterItems;
};

/**
 * ---------------------------------------------------- *
 * @function formatIdr
 * @summary id-ID digit grouping ("50.000") for price
 * input/labels — dot-grouped so filter item titles never
 * contain the `,` DELIMITER
 * ---------------------------------------------------- *
 */
export const formatIdr = value => new Intl.NumberFormat('id-ID').format(Number(value) || 0);

/**
 * ---------------------------------------------------- *
 * @function priceItemTitle
 * @summary display title for a custom price-range item
 * (URL title part + CurrentFilters chip label)
 * ---------------------------------------------------- *
 */
export const priceItemTitle = (lo, hi) => `Rp${formatIdr(lo)} - Rp${formatIdr(hi)}`;
