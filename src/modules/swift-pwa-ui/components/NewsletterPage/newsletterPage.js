import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Newsletter from '../Newsletter';
import defaultClasses from './newsletterPage.module.css';

const NewsletterPage = props => {
    const classes = useStyle(defaultClasses);

    return (
        <div className={classes.root}>
            <Newsletter />
        </div>
    );
};

export default NewsletterPage;
