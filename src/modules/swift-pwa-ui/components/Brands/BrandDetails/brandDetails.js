import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToasts } from '@magento/peregrine';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { useStyle } from '@magento/venia-ui/lib/classify';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { useBrands } from '../../../../peregrine/talons/Brands/useBrands';
import Product from './product';
import defaultClasses from './brandDetails.module.css';

const BrandDetails = () => {
    const classes = useStyle(defaultClasses);
    const { brandId = '' } = useParams();
    const [, { addToast }] = useToasts();

    const { brandDetailsData, brandDetailsLoading, errors } = useBrands({
        urlKey: brandId
    });

    const brandDetailsError = deriveErrorMessage([
        errors.get('getBrandDetailsQuery')
    ]);

    useEffect(() => {
        if (brandDetailsError) {
            addToast({
                type: 'error',
                message: brandDetailsError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, brandDetailsError]);

    if (brandDetailsLoading) return fullPageLoadingIndicator;

    if (
        !brandDetailsData ||
        !brandDetailsData.categories ||
        !brandDetailsData.categories.items ||
        !brandDetailsData.categories.items[0]
    )
        return (
            <div className={classes.brandError}>
                <ErrorView message="Brand Details Not Found" />
            </div>
        );

    const brandInformation = brandDetailsData.categories.items[0];

    return (
        <>
            {brandInformation.image && (
                <div
                    className="jumbotron jumbotron-image"
                    style={{
                        backgroundImage: `url(
                ${brandInformation.image}
            )`,
                        height: 302,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            )}
            <div className={classes.rootDetails}>
                <div className={classes.breadCrumb}>
                    <Link
                        className={classes.breadCrumbLink}
                        to="/"
                    >{`Home`}</Link>
                    <span className={classes.breadCrumbSeparator}>{`/`}</span>
                    <Link
                        className={classes.breadCrumbLink}
                        to="/brands"
                    >{`Brands`}</Link>
                    <span className={classes.breadCrumbSeparator}>{`/`}</span>
                    <span className={classes.breadCrumbText}>
                        {brandInformation.name || 'Brands'}
                    </span>
                </div>

                <div className={classes.info}>
                    <h1 className={classes.title}>{brandInformation.name}</h1>
                    <RichContent html={brandInformation.description} />
                </div>

                <Product id={brandId} classes={classes} />
            </div>
        </>
    );
};

export default BrandDetails;
