import React from 'react';
import { bool, func, shape, string } from 'prop-types';
import { Check as CheckIcon } from 'react-feather';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './optionRow.module.css';

/**
 * Presentational checkbox row for filter options (square
 * box, app's CheckBox colors: gray border unchecked, brand
 * orange with a white check checked). The informed-based
 * Checkbox requires a Form field context the new sections
 * don't have, so this uses a visually-hidden native input
 * for keyboard/a11y parity.
 */
const OptionRow = ({ label, checked, onToggle, ariaLabel, classes: propsClasses }) => {
    const classes = useStyle(defaultClasses, propsClasses);

    return (
        <label className={classes.root}>
            <input
                type="checkbox"
                className={classes.input}
                checked={checked}
                onChange={onToggle}
                aria-label={ariaLabel || label}
            />
            <span className={checked ? classes.boxChecked : classes.box}>{checked ? <CheckIcon /> : null}</span>
            <span className={classes.label}>{label}</span>
        </label>
    );
};

OptionRow.propTypes = {
    label: string,
    checked: bool,
    onToggle: func,
    ariaLabel: string,
    classes: shape({
        root: string,
        input: string,
        box: string,
        boxChecked: string,
        label: string,
    }),
};

export default OptionRow;
