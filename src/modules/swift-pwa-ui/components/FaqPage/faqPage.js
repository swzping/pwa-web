import React from 'react';
import { shape, string } from 'prop-types';
import { useIntl } from 'react-intl';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { useStyle } from '@magento/venia-ui/lib/classify';
import FaqPageShimmer from './faqPage.shimmer';
import defaultClasses from './faq.module.css';

const FaqPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { formatMessage } = useIntl();

    const pageTitle = formatMessage({
        id: 'faq.headTitle',
        defaultMessage: 'FAQ'
    });

    const shimmerContent = <FaqPageShimmer />;

    return (
        <div>
            <StoreTitle>{pageTitle}</StoreTitle>
            <CmsBlock
                shimmer={shimmerContent}
                classes={{
                    root: classes.root
                }}
                identifiers={['faq']}
            />
        </div>
    );
};

export default FaqPage;

FaqPage.propTypes = {
    classes: shape({
        root: string
    })
};
