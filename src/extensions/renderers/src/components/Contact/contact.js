import React from 'react';
import parse from 'html-react-parser';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { unescapeHTML } from '../../helpers';
import { ContactForm } from './commons';
import defaultClasses from './contact.module.css';

const Contact = props => {
    const classes = useStyle(defaultClasses);

    const options = {
        replace: domNode => {
            if (!domNode.attribs) {
                return;
            }
            if (domNode.attribs && domNode.attribs.class === 'contact-form') {
                return <ContactForm />;
            }
        }
    };

    return (
        <div className={classes.root}>
            {parse(unescapeHTML(props.html), options)}
        </div>
    );
};

export default Contact;
