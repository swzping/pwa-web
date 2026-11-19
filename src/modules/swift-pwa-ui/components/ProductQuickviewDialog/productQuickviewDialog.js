import React from 'react';
import Dialog from '@magento/venia-ui/lib/components/Dialog';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';

import { useProductQuickviewDialog } from '../../../peregrine/talons/ProductQuickviewDialog/useProductQuickviewDialog';
import ProductFullDetail from '../../../../overrides/venia-ui/components/ProductFullDetail/productFullDetail';
import defaultClasses from './productQuickviewDialog.module.css';

const productQuickviewDialog = (props) => {
    const { 
        productDetail,
        productDetailLink,
        productDetailLoading,
        handleOnClose,
    } = useProductQuickviewDialog(props);

    const content = productDetailLoading
        ? <LoadingIndicator global={true} />
        : <ProductFullDetail
            product={productDetail}
            productLink={productDetailLink}
            disableDescription={true}
            disableRelatedProducts={true}
        />;
    
    return (
        <Dialog
            classes={defaultClasses}
            isForm={false}
            isOpen={!!productDetail}
            onCancel={handleOnClose}
            shouldShowButtons={false}
            shouldDisableAllButtons={productDetailLoading}
        >
            {content}
        </Dialog>
    );
};

export default productQuickviewDialog;
