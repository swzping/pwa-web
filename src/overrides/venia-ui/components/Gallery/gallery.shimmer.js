import React from 'react';
import { shape, string, array, object } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';

import GalleryItemShimmer from '@magento/venia-ui/lib/components/Gallery/item.shimmer';
import defaultClasses from '@magento/venia-ui/lib/components/Gallery/gallery.module.css';

const GalleryShimmer = props => {
    const { items, itemProps, pageView = '' } = props;
    const classes = useStyle(defaultClasses, props.classes);

    return (
        <div className={classes.root} aria-live="polite" aria-busy="true">
            <div className={pageView === 'widget' ? classes.itemsWidget : classes.items}>
                {items.map((item, index) => (
                    <GalleryItemShimmer key={index} {...itemProps} />
                ))}
            </div>
        </div>
    );
};

GalleryShimmer.defaultProps = {
    items: [],
    itemProps: {}
};

GalleryShimmer.propTypes = {
    classes: shape({
        root: string,
        items: string
    }),
    items: array,
    itemProps: shape({
        classes: object
    })
};

export default GalleryShimmer;
