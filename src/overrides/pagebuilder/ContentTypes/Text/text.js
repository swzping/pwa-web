import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './text.module.css';
import { useHistory } from 'react-router-dom';
import handleHtmlContentClick from '../../handleHtmlContentClick';
import Heading from '../Heading';
import parse from 'html-react-parser';

import htmlStringImgUrlConverter from '@magento/peregrine/lib/util/htmlStringImgUrlConverter';

const toHTML = str => {
    let html = htmlStringImgUrlConverter(str);

    if (html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const links = tempDiv.querySelectorAll('a');

        links.forEach(link => {
            const title = link.getAttribute('title');
            if (title) {
                const existingSpan = link.querySelector(
                    'span[style*="display: none"]'
                );
                if (!existingSpan) {
                    const span = document.createElement('span');
                    span.style.display = 'none';
                    span.textContent = title;
                    link.insertBefore(span, link.firstChild);
                }
            }
        });

        html = tempDiv.innerHTML;
    }

    return { __html: html };
};

const getHeadingConfig = node => {
    const result = {
        text: '',
        viewAllLink: '',
        viewAllTitle: '',
        color: '#FF8200'
    };
    const traverse = node => {
        if (!node) return;
        if (node.type === 'strong') {
            result.text = node.props?.children;
        }
        if (node.type === 'a') {
            result.viewAllTitle = node.props?.children;
            result.viewAllLink = node.props?.href;
        }
        let children = node.props?.children;
        children && Array.isArray(children)
            ? children.forEach(v => {
                  traverse(v);
              })
            : traverse(children);
    };

    traverse(node);

    return result;
};

/**
 * Page Builder Text component.
 *
 * This component is part of the Page Builder / PWA integration. It can be consumed without Page Builder.
 *
 * @typedef Text
 * @kind functional component
 *
 * @param {props} props React component props
 *
 * @returns {React.Element} A React component that displays a Text content type which contains content.
 */
const Text = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const {
        content,
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

    const headingConfig = getHeadingConfig(parse(content));

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

    const history = useHistory();

    const clickHandler = event => {
        handleHtmlContentClick(history, event);
    };

    return cssClasses?.includes('heading-2column') ? (
        <Heading {...headingConfig} />
    ) : (
        <div
            style={dynamicStyles}
            className={[classes.root, ...cssClasses].join(' ')}
            dangerouslySetInnerHTML={toHTML(content)}
            onClick={clickHandler}
            onKeyDown={clickHandler}
            role="presentation"
        />
    );
};

/**
 * Props for {@link Text}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the Text
 * @property {String} classes.root CSS class for the root text element
 * @property {String} content Content to be rendered within the content type
 * @property {String} textAlign Alignment of content within the text
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
Text.propTypes = {
    classes: shape({
        root: string
    }),
    content: string,
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

export default Text;
