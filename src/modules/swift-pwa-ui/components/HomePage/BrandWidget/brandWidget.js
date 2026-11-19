import React from 'react';
import { domToReact } from 'html-react-parser';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from './brandWidget.module.css';
import { trackHomeCommonModuleClick, initCmsClickTracker } from '@/utils/track';

const BrandWidget = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { domNode, dynamicStyles } = props;
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    let childNodes = domNode.children.filter(
        child => child.type === 'tag' && child.attribs
    );

    childNodes = isMobile ? childNodes.slice(0, 6) : childNodes.slice(0, 12)


    const handleTrackClick = initCmsClickTracker({
        selector: 'a',
        resourceType: 'BrandWidget',
        trackFn: trackHomeCommonModuleClick,
        extraParams: {
            cssClasses: props.cssClasses || []
        }
    });

    return (
        <div
            className={classes.root}
            style={dynamicStyles}
            onClick={handleTrackClick}
        >
            {domToReact(childNodes)}
        </div>
    );
};

export default BrandWidget;
