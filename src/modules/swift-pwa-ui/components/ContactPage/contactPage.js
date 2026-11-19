import React, { useEffect, useContext } from 'react';
import { shape, string } from 'prop-types';
import { useIntl } from 'react-intl';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock/cmsBlock';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { HeaderContext } from '../../../../overrides/peregrine/context/header';
import ContactPageShimmer from './contactPage.shimmer';
import defaultClasses from './contact.module.css';

const ContactPage = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { setNavConfig } = useContext(HeaderContext);
    const { formatMessage } = useIntl();

    const pageTitle = formatMessage({
        id: 'contact.headTitle',
        defaultMessage: 'Contact Us'
    });

    useEffect(() => {
        setNavConfig({
            headerTitle: 'CONTACT US',
            useCart: false,
            borderBottom: true
        });
    }, []);

    const shimmerContent = (
        <ContactPageShimmer items={Array.from({ length: 3 }).fill(null)} />
    );

    return (
        <div>
            <StoreTitle>{pageTitle}</StoreTitle>
            <CmsBlock
                shimmer={shimmerContent}
                classes={{
                    root: classes.root
                }}
                identifiers={['contact']}
            />
        </div>
    );
};

export default ContactPage;

ContactPage.propTypes = {
    classes: shape({
        root: string
    })
};
