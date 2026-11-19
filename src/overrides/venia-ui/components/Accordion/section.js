import React, { useCallback } from 'react';
import { ChevronDown as ArrowDown, ChevronUp as ArrowUp } from 'react-feather';

import { useAccordionContext } from '@magento/venia-ui/lib/components/Accordion/accordion';
import Icon from '@magento/venia-ui/lib/components/Icon';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/Accordion/section.module.css';

const Section = props => {
    const {
        children,
        id,
        title,
        iconOpen,
        iconClose,
        iconSize,
        classNames
    } = props;

    const { handleSectionToggle, openSectionIds } = useAccordionContext();

    const handleSectionToggleWithId = useCallback(
        () => handleSectionToggle(id),
        [handleSectionToggle, id]
    );

    const isOpen = openSectionIds.has(id);
    const titleIconSrc = isOpen ? iconClose || ArrowUp : iconOpen || ArrowDown;
    const titleIcon = (
        <Icon
            src={titleIconSrc}
            size={iconSize || 24}
            className={classNames || ''}
        />
    );

    const classes = useStyle(defaultClasses, props.classes);
    const contentsContainerClass = isOpen
        ? classes.contents_container
        : classes.contents_container_closed;

    return (
        <div className={classes.root}>
            <button
                className={classes.title_container}
                onClick={handleSectionToggleWithId}
                type="button"
            >
                <span className={classes.title_wrapper}>
                    <span className={classes.title}>{title}</span>
                    {titleIcon}
                </span>
            </button>
            <div className={contentsContainerClass}>{children}</div>
        </div>
    );
};

export default Section;
