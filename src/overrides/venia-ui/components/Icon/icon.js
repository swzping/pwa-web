import React from 'react';
import { object, number, oneOfType, shape, func, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './icon.module.css';

const Icon = props => {
    const {
        attrs,
        classes: propClasses,
        size,
        src: Component,
        ...restProps
    } = props;
    const classes = useStyle(defaultClasses, propClasses);
    const { width, ...restAttrs } = attrs || {};
    const computedSize = size || width;
    const isSvgComponent = typeof Component === 'function';

    return (
        <span className={classes.root} {...restProps}>
            <Component
                {...(isSvgComponent
                    ? { style: { fontSize: computedSize }, ...restAttrs }
                    : { className: classes.icon, size: computedSize, ...restAttrs })}
            />
        </span>
    );
};

export default Icon;

Icon.propTypes = {
    attrs: shape({}),
    classes: shape({
        icon: string,
        root: string
    }),
    size: number,
    src: oneOfType([object, func]).isRequired
};
