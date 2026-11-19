import React, { useMemo, useEffect, useRef } from 'react';
import { gql, useQuery } from '@apollo/client';
import { arrayOf, bool, number, oneOf, shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Gallery from '../../../venia-ui/components/Gallery/item';
import GalleryShimmer from '../../../venia-ui/components/Gallery/gallery.shimmer';
import Carousel from './Carousel/carousel';
import { useWindowSize } from '@magento/peregrine';
import DEFAULT_OPERATIONS from '../../../../modules/peregrine/talons/Header/header.gql';
import Heading from '../Heading';
import { useHistory } from 'react-router-dom';
import { useSimpleCountdown } from '../../../venia-ui/components/ProductFullDetail/countDown/useCountdown';

import defaultClasses from './flashSale.module.css';
/**
 * Sort products based on the original order
 *
 * @param {Array} urlKeys
 * @param {Array} products
 * @returns {Array}
 */
const restoreSortOrder = (urlKeys, products) => {
    const productsByOriginalOrder = new Map();
    products?.forEach(product => {
        productsByOriginalOrder.set(product.url_key, product);
    });
    return urlKeys
        .map(urlKey => productsByOriginalOrder.get(urlKey))
        .filter(Boolean);
};

const FlashSale = props => {
    const history = useHistory();
    const classes = useStyle(defaultClasses, props.classes);
    const props1 = {
        appearance: 'carousel',
        autoplaySpeed: 4000,
        pathNames: [
            'https://mcstaging.guardianindonesia.co.id/azarine-calm-my-acne-sun-spf35-40gr.html'
        ],
        textAlign: '',
        border: '',
        borderColor: '',
        borderWidth: '',
        borderRadius: '',
        marginTop: '',
        marginRight: '',
        marginBottom: '',
        marginLeft: '',
        paddingTop: '',
        paddingRight: '',
        paddingBottom: '',
        paddingLeft: '',
        cssClasses: ['container', 'wrp-2']
    };
    const {
        appearance,
        autoplay,
        autoplaySpeed,
        infinite,
        arrows,
        dots,
        draggable = false,
        carouselMode,
        centerPadding,
        pathNames = [],
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        cssClasses = [],
        slidesToShow = 6,
        slidesToShowMedium = 4,
        slidesToShowSmall = 2,
        slidesToShowSmallCenterMode = 1
    } = props1;

    const dynamicStyles = {
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
    };

    const { data: storeConfigData } = useQuery(
        DEFAULT_OPERATIONS.getStoreConfigData,
        {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first'
        }
    );

    const productUrlSuffix = useMemo(() => {
        if (storeConfigData) {
            return storeConfigData.storeConfig.product_url_suffix;
        }
    }, [storeConfigData]);

    const urlKeys = pathNames.map(pathName => {
        const slug = pathName.split('/').pop();
        return productUrlSuffix ? slug.replace(productUrlSuffix, '') : slug;
    });

    const { loading, error, data } = useQuery(GET_PRODUCTS_BY_URL_KEY, {
        variables: { is_flash_sale: '1', pageSize: 12 },
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-and-network',
    });

    const carouselRef = useRef(null);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    let carouselSettings = {};
    if (appearance === 'carousel') {
        carouselSettings = {
            autoplay: false,
            autoplaySpeed,
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
    }

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

    // const items = restoreSortOrder(urlKeys, data.products.items);
    const items = data?.products?.items?.slice(0, 10) || [];
    // NOTE: useSimpleCountdown must be called unconditionally on every render
    // (React Rules of Hooks). Calling it after an early return causes
    // "Rendered more hooks than during the previous render".
    const { hours, minutes, seconds } = useSimpleCountdown(
        items[0]?.special_from_date,
        items[0]?.special_to_date
    );

    if (error || data?.products?.items?.length === 0) {
        return null;
    }

    if(!hours && !minutes && !seconds) {
        return null
    }

    if (loading) {
        return (
            <GalleryShimmer
                items={Array.from({ length: urlKeys.length || 5 }).fill(null)}
                pageView="widget"
            />
        );
    }
    
    if (appearance === 'carousel') {
        return (
            <div className={classes.flashWrap}>
                <div className={classes.flashHeader}>
                    <div style={{ display: 'flex' }}>
                        <img
                            style={{
                                margin: 0,
                                borderRadius: 0,
                                marginRight: isMobile ? 0 : 50,
                                marginLeft: isMobile ? 0 : '0.5rem',
                                width: 'auto',
                                alignSelf: 'center'
                            }}
                            src="/venia-static-assets/images/newFlash.png"
                        />
                        {!isMobile && (
                            <div className={classes.endsAfterWrap}>
                                <div className={classes.endAfter}>
                                    End after <span>{hours}</span>:
                                    <span>{minutes}</span>:
                                    <span>{seconds}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {isMobile ? (
                        <div className={classes.endsAfterWrapOfMobile}>
                            <div className={classes.endsAfterOfMobile}>
                                <span>{hours}</span>:<span>{minutes}</span>:
                                <span>{seconds}</span>
                            </div>
                            <div
                                onClick={() => {
                                    history.push('/flash-sale.html')
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: '#fff'
                                    }}
                                >
                                    Show All
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path
                                        d="M5.25 10.5L8.75 7L5.25 3.5"
                                        stroke="white"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: 160 }}>
                            <Heading
                                viewAllTitle="Show All"
                                viewAllLink={'/flash-sale.html'}
                            />
                        </div>
                    )}
                </div>
                <div
                    ref={carouselRef}
                    style={dynamicStyles}
                    className={[classes.carousel].join(' ')}
                >
                    <Carousel settings={carouselSettings} items={items} />
                </div>
            </div>
        );
    }

    return (
        <div
            style={dynamicStyles}
            className={[classes.root, ...cssClasses].join(' ')}
        >
            <Gallery items={items} classes={{ items: classes.galleryItems }} />
        </div>
    );
};

/**
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the FlashSale
 * @property {String} classes.root CSS class for products
 * @property {String} classes.carousel CSS class for products carousel appearance
 * @property {String} classes.centerMode CSS class for products carousel appearance with center mode
 * @property {String} classes.centerModeSmall CSS class for products carousel appearance with center mode on small screen
 * @property {String} classes.galleryItems CSS class to modify child gallery items
 * @property {String} classes.error CSS class for displaying fetch errors
 * @property {String} appearance Sets products appearance
 * @property {Boolean} autoplay Whether the carousel should autoplay
 * @property {Number} autoplaySpeed The speed at which the autoplay should move the slide on
 * @property {Boolean} infinite Whether to infinitely scroll the carousel
 * @property {Boolean} arrows Whether to show arrows on the slide for navigation
 * @property {Boolean} dots Whether to show navigation dots at the bottom of the carousel
 * @property {Boolean} draggable Enable scrollable via dragging on desktop
 * @property {String} carouselMode Carousel mode
 * @property {String} centerPadding Horizontal padding in centerMode
 * @property {Array} pathNames List of Url path names to load into product list
 * @property {String} textAlign Alignment of content within the products list
 * @property {String} border CSS border property
 * @property {String} borderColor CSS border color property
 * @property {String} borderWidth CSS border width property
 * @property {String} borderRadius CSS border radius property
 * @property {String} marginTop CSS margin top property
 * @property {String} marginRight CSS margin right property
 * @property {String} marginBottom CSS margin bottom property
 * @property {String} marginLeft CSS margin left property
 * @property {String} paddingTop CSS padding top property
 * @property {String} paddingRight CSS padding right property
 * @property {String} paddingBottom CSS padding bottom property
 * @property {String} paddingLeft CSS padding left property
 * @property {Array} cssClasses List of CSS classes to be applied to the component
 * @property {Number} slidesToShow # of slides to show at a time
 * @property {Number} slidesToShowMedium # of slides to show at a time on medium sized screens
 * @property {Number} slidesToShowSmall # of slides to show at a time on small screen
 * @property {Number} slidesToShowSmallCenterMode # of slides to show at a time on small screen in centerMode
 */
FlashSale.propTypes = {
    classes: shape({
        root: string,
        carousel: string,
        centerMode: string,
        centerModeSmall: string,
        galleryItems: string,
        error: string
    }),
    appearance: oneOf(['grid', 'carousel']),
    autoplay: bool,
    autoplaySpeed: number,
    infinite: bool,
    arrows: bool,
    dots: bool,
    draggable: bool,
    carouselMode: oneOf(['default', 'continuous']),
    centerPadding: string,
    pathNames: arrayOf(string),
    textAlign: string,
    border: string,
    borderColor: string,
    borderWidth: string,
    borderRadius: string,
    marginTop: string,
    marginRight: string,
    marginBottom: string,
    marginLeft: string,
    paddingTop: string,
    paddingRight: string,
    paddingBottom: string,
    paddingLeft: string,
    cssClasses: arrayOf(string),
    slidesToShow: number,
    slidesToShowMedium: number,
    slidesToShowSmall: number,
    slidesToShowSmallCenterMode: number
};

export default FlashSale;

export const GET_PRODUCTS_BY_URL_KEY = gql`
    query getProductsByUrlKey($is_flash_sale: String, $pageSize: Int!) {
        products(
            filter: { is_flash_sale: { eq: $is_flash_sale } }
            pageSize: $pageSize
        ) {
            items {
                id
                uid
                categories {
                    id
                    uid
                    name
                    level
                    __typename
                }
                name
                offers {
                    id
                    rule_code
                    name
                    description
                    image
                    promotion_type
                }
                is_flash_sale
                special_price
                special_from_date
                special_to_date
                price_range {
                    maximum_price {
                        discount {
                            amount_off
                            percent_off
                            __typename
                        }
                        final_price {
                            currency
                            value
                            __typename
                        }
                        fixed_product_taxes {
                            amount {
                                currency
                                value
                                __typename
                            }
                            label
                            __typename
                        }
                        regular_price {
                            currency
                            value
                            __typename
                        }
                        __typename
                    }
                    minimum_price {
                        discount {
                            amount_off
                            percent_off
                            __typename
                        }
                        final_price {
                            currency
                            value
                            __typename
                        }
                        fixed_product_taxes {
                            amount {
                                currency
                                value
                                __typename
                            }
                            label
                            __typename
                        }
                        regular_price {
                            currency
                            value
                            __typename
                        }
                        __typename
                    }
                    __typename
                }
                sku
                small_image {
                    url
                    __typename
                }
                stock_status
                stock_item {
                    qty
                    min_qty
                    min_sale_qty
                    max_sale_qty
                    salable_qty
                    backorders
                    qty_increments
                    manage_stock
                    is_in_stock
                    __typename
                }
                type_id
                url_key
                variant_parent_sku
                variant_parent_url
                variant_parent_url_key
                variant_parent_url_suffix
                variant_preselected_options
                promo
                sale
                __typename
            }
            total_count
            __typename
        }
    }
`;
