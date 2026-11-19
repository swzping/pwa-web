import React, {useMemo, useEffect, useRef } from 'react';
import { string, number, shape } from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { GalleryShimmer } from '@magento/venia-ui/lib/components/Gallery';
import Carousel from '@magento/pagebuilder/lib/ContentTypes/Products/Carousel/carousel';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from '../../../../overrides/pagebuilder/ContentTypes/Products/products.module.css';
import productRecommendClasses from './productRecommend.module.css';
import { useQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/RootComponents/Product/product.gql';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import mapProduct from '@magento/venia-ui/lib/util/mapProduct';

const ProductRecommend = props => {
    const classes = useStyle(
        defaultClasses,
        props.classes,
        productRecommendClasses
    );
    const { urlKey } = props;
    const { getProductDetailCrosssellQuery } = mergeOperations(DEFAULT_OPERATIONS);

    const { data, loading } = useQuery(getProductDetailCrosssellQuery, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !urlKey,
        variables: { urlKey }
    });

    const product = useMemo(() => {
        if (!data) {
            return null;
        }
        const product = data.products.items.find(
            item => item.url_key === urlKey
        );

        if (!product) {
            return null;
        }

        return mapProduct(product);
    }, [data, mapProduct, urlKey]);

    const carouselRef = useRef(null);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    const carouselSettings = {
        autoplay: false,
        autoplaySpeed: 4000,
        arrows: !isMobile,
        dots: false,
        breakpoints: {
            0: {
                slidesPerView: 2.2,
                spaceBetween: 8
            },
            640: {
                slidesPerView: 3.5,
                spaceBetween: 8
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 16
            },
            960: {
                slidesPerView: 4,
                spaceBetween: 16
            },
            1024: {
                slidesPerView: 5,
                spaceBetween: 16
            }
        }
    };

    useEffect(() => {
        if (carouselRef.current) {
            const slickList = carouselRef.current.querySelector('.slick-list');
            if (slickList && isMobile) {
                const breakpointSettings = carouselSettings.responsive.find(
                    r => r.breakpoint === 767
                );
                if (
                    breakpointSettings &&
                    breakpointSettings.settings.slidesToShow === 2.5
                ) {
                    const sliderWidth = slickList.offsetWidth;
                    const calculatedPadding = sliderWidth / 5;
                    slickList.style.paddingLeft = `${calculatedPadding}px`;
                }
            }
        }
    }, [data, carouselSettings]);

    if (!urlKey || loading) {
        return (
            <GalleryShimmer
                items={Array.from({ length: 5 }).fill(null)}
                pageView="widget"
            />
        );
    } else if (!product?.crosssell_products?.length) {
        return null;
    }

    return (
        <>
            <div className={classes.recommendHeader}>You May Also Like</div>
            <div
                ref={carouselRef}
                className={[classes.root, classes.carousel].join(' ')}
            >
                <Carousel settings={carouselSettings} items={product.crosssell_products} />
            </div>
        </>
    );
};

ProductRecommend.propTypes = {
    items: shape({
            id: number,
            uid: number,
            categories: shape({
                id: number,
                uid: number,
                name: string,
                level: string
            }),
            name: string,
            special_price: string,
            price_range: shape({
                maximum_price: shape({
                    discount: shape({
                        amount_off: string,
                        percent_off: string,
                    }),
                    final_price: shape({
                        currency: string,
                        value: string,
                    }),
                    regular_price: shape({
                        currency: string,
                        value: string,
                    })
                }),
                minimum_price: shape({
                    discount: shape({
                        amount_off: string,
                        percent_off: string,
                    }),
                    final_price: shape({
                        currency: string,
                        value: string,
                    }),
                    regular_price: shape({
                        currency: string,
                        value: string,
                    })
                })
            }),
            sku: string,
            small_image: shape({
                url: string,
            }),
            stock_status: string,
            type_id: string,
            url_key: string,
            promo: string,
            sale: string,
    })
};

export default ProductRecommend;

