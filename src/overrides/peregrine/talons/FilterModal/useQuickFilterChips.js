import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useAppContext } from '@magento/peregrine/lib/context/app';
import { DELIMITER, getFiltersFromSearch } from '@magento/peregrine/lib/talons/FilterModal/helpers';

import {
    resolveFallbackQuickFilterChips,
    resolveQuickFilterChips,
} from '../../../../modules/plp-filter/filterRenderers';

const DRAWER_NAME = 'filter';

const valuePartOf = raw => String(raw).split(DELIMITER)[1];

/**
 * Mobile PLP quick-filter chips (app parity). Chips toggle
 * a fixed facet value straight into the URL — the URL
 * driven product queries refetch automatically, and the
 * selected state is read back from the URL so it always
 * reflects applied (not draft) filters. Requires-option
 * chips just open the filter sheet. When the backend does
 * not expose guidQuickFilterSettings, one chip per visible
 * boolean facet is offered (app fallback path).
 */
export const useQuickFilterChips = ({ filters, quickFilterSettings }) => {
    const [{ drawer }, { toggleDrawer }] = useAppContext();
    const history = useHistory();
    const { pathname, search } = useLocation();

    const chips = useMemo(
        () =>
            quickFilterSettings
                ? resolveQuickFilterChips(quickFilterSettings, filters)
                : resolveFallbackQuickFilterChips(filters),
        [filters, quickFilterSettings],
    );

    const appliedState = useMemo(() => getFiltersFromSearch(search), [search]);

    const isChipSelected = useCallback(
        chip => {
            if (chip.opensPanel) {
                return false;
            }
            const values = appliedState.get(chip.attributeCode);
            if (!values) {
                return false;
            }
            return Array.from(values).some(raw => valuePartOf(raw) === String(chip.value));
        },
        [appliedState],
    );

    const openPanel = useCallback(() => {
        if (drawer !== DRAWER_NAME) {
            toggleDrawer(DRAWER_NAME);
        }
    }, [drawer, toggleDrawer]);

    const toggleChip = useCallback(
        chip => {
            if (chip.opensPanel) {
                openPanel();
                return;
            }
            const params = new URLSearchParams(search);
            const key = `${chip.attributeCode}[filter]`;
            const existing = params.getAll(key);
            const kept = existing.filter(raw => valuePartOf(raw) !== String(chip.value));
            if (kept.length === existing.length) {
                params.append(key, `${chip.label}${DELIMITER}${chip.value}`);
            } else {
                params.delete(key);
                kept.forEach(raw => params.append(key, raw));
            }
            history.push({ pathname, search: `?${params.toString()}` });
        },
        [search, pathname, history, openPanel],
    );

    return { chips, isChipSelected, toggleChip };
};

export default useQuickFilterChips;
