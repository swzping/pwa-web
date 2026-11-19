import React, { Fragment, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { string } from 'prop-types';
import { useProduct } from '@magento/peregrine/lib/talons/RootComponents/Product/useProduct';

import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { StoreTitle, Meta } from '@magento/venia-ui/lib/components/Head';
import ProductFullDetail from '@magento/venia-ui/lib/components/ProductFullDetail';
import mapProduct from '@magento/venia-ui/lib/util/mapProduct';
import ProductShimmer from '@magento/venia-ui/lib/RootComponents/Product/product.shimmer';

import { viewContentFbPixel } from '../../../../helpers/fbpixel';

/*
 * As of this writing, there is no single Product query type in the M2.3 schema.
 * The recommended solution is to use filter criteria on a Products query.
 * However, the `id` argument is not supported. See
 * https://github.com/magento/graphql-ce/issues/86
 * TODO: Replace with a single product query when possible.
 */

const Product = props => {
    const { __typename: productType } = props;
    const location = window.location.href;
    const talonProps = useProduct({
        mapProduct
    });

    const { error, loading, product, urlKey } = talonProps;
    const videoExtensions = [
            '.mp4',
            '.avi',
            '.mov',
            '.wmv',
            '.flv',
            '.webm',
            '.mkv',
            '.m4v',
            '.3gp',
            '.ogg',
            '.ogv',
            '.qt',
            '.mpeg',
            '.mpg',
            '.mpe',
            '.mpv',
            '.m2v',
            '.m4p',
            '.m4v',
            '.f4v',
            '.f4p',
            '.f4a',
            '.f4b'
        ];
        const _videos = [];
        const _nonVideos = [];
        product?.media_gallery_entries.forEach((image) => {
            const _isVideo = videoExtensions.some(ext =>
                image?.label?.toLowerCase().includes(ext)
            );
            if (_isVideo) {
                _videos.push(image);
            } else {
                _nonVideos.push(image);
            }
        });
        const mediaGalleryEntriesSort = _videos.concat(_nonVideos).map((item, index) => {
            return {
                ...item,
                position: index + 1
            }
        })
    const _product = {
        ...product,
        media_gallery_entries: mediaGalleryEntriesSort
    }

    useEffect(() => {
        if (product && process.env.FACEBOOK_PIXEL_ENABLE === 'true' && process.env.FACEBOOK_PIXEL_ID) {
            const sku = product.sku;
            const name = product.name;
            const price = product.price_range.maximum_price.final_price.value;
            const currency = product.price_range.maximum_price.final_price.currency;

            viewContentFbPixel(sku, name, price, currency);
        }
    }, [product]);

    if (loading && !product)
        return <ProductShimmer productType={productType} />;
    if (error && !product) return <ErrorView />;
    if (!product) {
        return (
            <h1>
                <FormattedMessage
                    id={'product.outOfStockTryAgain'}
                    defaultMessage={
                        'This Product is currently out of stock. Please try again later.'
                    }
                />
            </h1>
        );
    }

    return (
        <Fragment>
            <StoreTitle>{product.name}</StoreTitle>
            <Meta name="description" content={product.meta_description} />

            <Meta name="title" content={product.name} />

            {/* Open Graph / Facebook */}
            <Meta property="og:type" content="website" />
            <Meta property="og:url" content={location} />
            <Meta property="og:title" content={product.name} />
            <Meta property="og:description" content={product.meta_description} />
            <Meta property="og:image" content={product.small_image}/>

            {/* Twitter */}
            <Meta property="twitter:card" content="summary_large_image" />
            <Meta property="twitter:url" content={location} />
            <Meta property="twitter:title" content={product.name} />
            <Meta property="twitter:description" content={product.meta_description} />
            <Meta property="twitter:image" content={product.small_image} />



            <ProductFullDetail product={_product} urlKey={urlKey}/>
        </Fragment>
    );
};

Product.propTypes = {
    __typename: string.isRequired
};

export default Product;
