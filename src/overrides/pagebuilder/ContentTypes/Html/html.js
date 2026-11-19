import React from 'react';
import parse from 'html-react-parser';
import defaultClasses from './html.module.css';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { arrayOf, shape, string } from 'prop-types';

import Brands from '../../../../modules/swift-pwa-ui/components/HomePage/Brands';
import BannerPromo from '../../../../modules/swift-pwa-ui/components/HomePage/BannerPromo';
import BrandWidget from '../../../../modules/swift-pwa-ui/components/HomePage/BrandWidget';
import SmallIcon from './SmallIcon';
import PopUp from '../PopUp';
import traverseNode from './traverseNode';

/**
 * Page Builder HTML component.
 *
 * This component is part of the Page Builder / PWA integration. It can be consumed without Page Builder.
 *
 * @typedef Html
 * @kind functional component
 *
 * @param {props} props React component props
 *
 * @returns {React.Element} A React component that renders HTML with optional styling properties.
 */
const Html = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const {
        html,
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        cssClasses = []
    } = props;

    const dynamicStyles = {
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
    };

    const options = {
        replace: domNode => {
            traverseNode(domNode)
            if (!domNode.attribs) {
                return;
            }
            if (cssClasses?.includes('wrapper-catalog-promotion')) {
                return <SmallIcon domNode={domNode} dynamicStyles={dynamicStyles} cssClasses={cssClasses} />;
            }
            if (['plp-small-icon', 'plp-brands'].some(item=> domNode.attribs.class?.includes(item))) {
                return <SmallIcon domNode={domNode} dynamicStyles={dynamicStyles} cssClasses={cssClasses} />;
            }
            if (cssClasses?.includes('homePage-ads-row')) {
                return  <PopUp domNode={domNode} dynamicStyles={dynamicStyles} cssClasses={cssClasses} />;
            }
            if (domNode.attribs && domNode.attribs.class?.includes('brands')) {
                return <BrandWidget domNode={domNode} dynamicStyles={dynamicStyles} cssClasses={cssClasses} />;
            }
            if (domNode.attribs && domNode.attribs.class === 'brand') {
                return <Brands />;
            }
            if (
                domNode.attribs &&
                domNode.attribs.class?.includes('banner-highlight-parent')
            ) {
                return (
                    <BannerPromo
                        domNode={domNode}
                        dynamicStyles={dynamicStyles}
                        cssClasses={cssClasses}
                    />
                );
            }
        }
    };

    return (
        <div
            style={dynamicStyles}
            className={[classes.root, ...cssClasses].join(' ')}
        >
            {parse(html, options)}
        </div>
    );
};

/**
 * Props for {@link Html}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the Html
 * @property {String} classes.root CSS classes for the root container element
 * @property {String} html HTML code to be rendered as part of component
 * @property {String} textAlign Alignment of the video within the parent container
 * @property {String} border CSS border property
 * @property {String} borderColor CSS border color property
 * @property {String} borderWidth CSS border width property
 * @property {String} borderRadius CSS border radius property
 * @property {String} marginTop CSS margin top property
 * @property {String} marginRight CSS margin right property
 * @property {String} marginBottom CSS margin bottom property
 * @property {String} marginLeft CSS margin left property
 * @property {String} paddingTop CSS padding top property
 * @property {String} paddingRight CSS padding right property
 * @property {String} paddingBottom CSS padding bottom property
 * @property {String} paddingLeft CSS padding left property
 * @property {Array} cssClasses List of CSS classes to be applied to the component
 */
Html.propTypes = {
    classes: shape({
        root: string
    }),
    html: string,
    textAlign: string,
    border: string,
    borderColor: string,
    borderWidth: string,
    borderRadius: string,
    marginTop: string,
    marginRight: string,
    marginBottom: string,
    marginLeft: string,
    paddingTop: string,
    paddingRight: string,
    paddingBottom: string,
    cssClasses: arrayOf(string)
};

export default Html;
