import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import Gallery from '@magento/venia-ui/lib/components/Gallery';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { useBrands } from '../../../../peregrine/talons/Brands/useBrands';

const Product = props => {
    const { id, classes } = props;
    const [, { addToast }] = useToasts();
    const { brandProductData, brandProductLoading, errors } = useBrands({
        brandId: id
    });

    const brandProductError = deriveErrorMessage([
        errors.get('getBrandProductQuery')
    ]);

    useEffect(() => {
        if (brandProductError) {
            addToast({
                type: 'error',
                message: brandProductError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, brandProductError]);

    if (brandProductLoading) {
        return fullPageLoadingIndicator;
    }

    if (
        !brandProductData ||
        !brandProductData.products ||
        !brandProductData.products.items ||
        !brandProductData.products.items.length > 0
    ) {
        return (
            <div
                className={classes.rootDetails}
                style={{ marginBottom: '5rem' }}
            >
                <FormattedMessage
                    id={'brand.NoProductFound'}
                    defaultMessage={'No Product Found'}
                />
            </div>
        );
    }

    return (
        <div className={classes.rootDetails}>
            <Gallery items={brandProductData.products.items} />
        </div>
    );
};

export default Product;
