import React, { useCallback } from 'react';
import { bool, func, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { CheckOutline } from '@//assets/icons';
import defaultClasses from './sortItem.module.css';

const SortItem = props => {
    const { active, onClick, sortItem } = props;
    const classes = useStyle(defaultClasses, props.classes);

    const handleClick = useCallback(
        e => {
            // use only left click for selection
            if (e.button === 0) {
                onClick(sortItem);
            }
        },
        [sortItem, onClick]
    );

    const handleKeyDown = useCallback(
        e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(sortItem);
            }
        },
        [onClick, sortItem]
    );

    const activeIcon = active ? <CheckOutline/> : null;

    return (
        <button
            className={classes.root}
            data-cy={active ? 'SortItem-activeButton' : 'SortItem-button'}
            onMouseDown={handleClick}
            onKeyDown={handleKeyDown}
        >
            <span
                className={`${classes.content} ${active ? classes.active : ''}`}
            >
                <span className={classes.text}>{sortItem.label}</span>
                {activeIcon}
            </span>
        </button>
    );
};

SortItem.propTypes = {
    active: bool,
    classes: shape({
        content: string,
        root: string,
        text: string,
        active: string
    }),
    onClick: func
};

export default SortItem;
