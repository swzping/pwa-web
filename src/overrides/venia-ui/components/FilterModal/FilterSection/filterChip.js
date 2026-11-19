import React from 'react';
import { bool, func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './filterChip.module.css';

/**
 * One filter pill, ported from the app's FilterChip:
 * selected = #FFE7BA bg + brand border + bold brand text,
 * unselected = light gray bg + transparent border.
 */
const FilterChip = ({ label, selected = false, onPress, classes: propsClasses }) => {
    const classes = useStyle(defaultClasses, propsClasses);

    return (
        <button
            type="button"
            className={selected ? `${classes.root} ${classes.selected}` : classes.root}
            onClick={onPress}
            aria-pressed={selected}
        >
            {String(label || '')}
        </button>
    );
};

FilterChip.propTypes = {
    label: string,
    selected: bool,
    onPress: func,
    classes: shape({
        root: string,
        selected: string,
    }),
};

export default FilterChip;
