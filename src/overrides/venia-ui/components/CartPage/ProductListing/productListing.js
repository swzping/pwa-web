import React from 'react';
import { useWindowSize } from '@magento/peregrine/lib/hooks/useWindowSize';
import MobileProductListing from './MobileProductListing';
import DesktopProductListing from './DesktopProductListing';

const ProductListing = props => {
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 768;

    return isMobile ? (
        <MobileProductListing {...props} />
    ) : (
        <DesktopProductListing {...props} />
    );
};

export default ProductListing;
