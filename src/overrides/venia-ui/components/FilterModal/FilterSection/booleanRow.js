import React from 'react';
import { bool, func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import OptionRow from './optionRow';
import defaultClasses from './booleanRow.module.css';

/**
 * Standalone boolean filter row (Halal, Free Item, ...)
 * rendered outside the accordion sections at the bottom
 * of the desktop sidebar.
 */
const BooleanRow = ({ label, checked, onToggle, classes: propsClasses }) => {
    const classes = useStyle(defaultClasses, propsClasses);

    return (
        <li className={classes.root}>
            <OptionRow label={label} checked={checked} onToggle={onToggle} />
        </li>
    );
};

BooleanRow.propTypes = {
    label: string,
    checked: bool,
    onToggle: func,
    classes: shape({
        root: string,
    }),
};

export default BooleanRow;
