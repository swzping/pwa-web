import React, { useState, useEffect } from 'react';
import { shape, string } from 'prop-types';
import CmsBlock from '@magento/venia-ui/lib/components/CmsBlock';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from '@magento/venia-ui/lib/components/Footer/footer.module.css';

const Footer = props => {
    const [isPhone, setIsPhone] = useState(window.innerWidth < 1024);
    const classes = useStyle(defaultClasses, props.classes);

    return (
        <div className="footer d-none d-sm-block">
            <CmsBlock
                classes={{
                    root: classes.cmsRoot,
                    content: classes.content
                }}
                identifiers={['footer_links_block']}
            />
        </div>
    );
};

export default Footer;

Footer.propTypes = {
    classes: shape({
        root: string,
        content: string
    })
};
