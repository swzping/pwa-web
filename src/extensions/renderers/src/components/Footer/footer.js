import React from 'react';
import parse from 'html-react-parser';
import { unescapeHTML } from '../../helpers';
import { Payments, Newsletter, SocialIcon } from './commons';
import classes from './styles.module.css';

const Footer = props => {
    const options = {
        replace: domNode => {
            if (!domNode.attribs) {
                return;
            }
            if (domNode.attribs && domNode.attribs.class === 'footer-form') {
                return <Newsletter />;
            }
            if (domNode.attribs && domNode.attribs.class === 'footer-media') {
                return <SocialIcon />;
            }
            if (domNode.attribs && domNode.attribs.class === 'payment-footer') {
                return <Payments />;
            }
        }
    };

    return (
        <div className={classes.root}>
            {parse(unescapeHTML(props.html), options)}
        </div>
    );
};

export default Footer;
