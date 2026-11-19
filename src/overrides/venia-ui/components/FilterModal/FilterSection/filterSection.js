import React from 'react';
import { bool, func, node, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { ChevronDownOutline, ChevronUpOutline } from '../../../../../assets/icons';
import defaultClasses from './filterSection.module.css';

/**
 * Accordion shell for one filter section. A truthy
 * `trailing` node replaces the chevron and drops the
 * collapsible body — boolean sections render their
 * checkbox inline in the header (app parity: the group
 * never expands, the header press toggles the value).
 */
const FilterSection = ({
    label,
    expanded,
    onToggleExpanded,
    trailing = null,
    isLast = false,
    children,
    classes: propsClasses,
}) => {
    const classes = useStyle(defaultClasses, propsClasses);
    const isBooleanMode = !!trailing;

    return (
        <li className={isLast ? `${classes.root} ${classes.last}` : classes.root}>
            <button
                type="button"
                className={classes.headerButton}
                onClick={onToggleExpanded}
                aria-expanded={isBooleanMode ? undefined : expanded}
            >
                <span className={classes.label}>{label}</span>
                {isBooleanMode ? (
                    trailing
                ) : (
                    <span className={classes.chevron}>{expanded ? <ChevronUpOutline /> : <ChevronDownOutline />}</span>
                )}
            </button>
            {!isBooleanMode && expanded ? <div className={classes.body}>{children}</div> : null}
        </li>
    );
};

FilterSection.propTypes = {
    label: node,
    expanded: bool,
    onToggleExpanded: func,
    trailing: node,
    isLast: bool,
    children: node,
    classes: shape({
        root: string,
        last: string,
        headerButton: string,
        label: string,
        chevron: string,
        body: string,
    }),
};

export default FilterSection;
