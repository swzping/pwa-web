import React from 'react';
import { useQuery } from '@apollo/client';
import { useStyle } from '@magento/venia-ui/lib/classify';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock/cmsBlock';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { GET_BENEFITS_PAGE_CONFIG } from './benefitsPage.gql';
import defaultClasses from './index.module.css';

const BenefitsPage = () => {
    const classes = useStyle(defaultClasses);

    const { data, loading, error } = useQuery(GET_BENEFITS_PAGE_CONFIG, {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all'
    });

    if (loading) {
        return fullPageLoadingIndicator;
    }

    if (error) {
        console.warn('BenefitsPage GraphQL Error:', error);
    }

    const cmsIdentifier = data?.storeConfig?.cms_membership_benefit_page_identifer;

    if (cmsIdentifier) {
        return (
            <div className={classes.root}>
                <CmsBlock identifiers={[cmsIdentifier]} />
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <h1 className={classes.title}>Member Benefits</h1>
        </div>
    );
};

export default BenefitsPage;
