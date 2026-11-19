import React from 'react';
import { array, node, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import useQuickFilterChips from '../../../peregrine/talons/FilterModal/useQuickFilterChips';
import defaultClasses from './quickFilterChips.module.css';

/**
 * Horizontal quick-filter chip row for the mobile PLP
 * header (hidden on desktop via CSS). `leading` renders as
 * the row's first item — app parity: the Filter entry pill
 * lives in the same scrolling row as the quick chips, and
 * the row shows even when no chips resolve.
 */
const QuickFilterChips = ({ filters, quickFilterSettings, leading = null }) => {
    const { chips, isChipSelected, toggleChip } = useQuickFilterChips({
        filters,
        quickFilterSettings,
    });
    const classes = useStyle(defaultClasses);

    if (!chips.length && !leading) {
        return null;
    }

    return (
        <div className={classes.root}>
            {leading}
            {chips.map(chip => (
                <button
                    key={chip.code}
                    type="button"
                    className={isChipSelected(chip) ? `${classes.chip} ${classes.chipSelected}` : classes.chip}
                    onClick={() => toggleChip(chip)}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );
};

QuickFilterChips.propTypes = {
    filters: array,
    quickFilterSettings: array,
    leading: node,
    classes: shape({
        root: string,
        chip: string,
        chipSelected: string,
    }),
};

export default QuickFilterChips;
