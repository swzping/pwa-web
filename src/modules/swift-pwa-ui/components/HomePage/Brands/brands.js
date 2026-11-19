import React, { useState, useEffect } from 'react';
import { shape, string } from 'prop-types';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwipeCore, { Navigation, Pagination } from 'swiper';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

import { useBrands } from '../../../../peregrine/talons/Brands/useBrands';
import defaultClasses from './brands.module.css';
import 'swiper/swiper-bundle.min.css';
import 'swiper/swiper.min.css';

SwipeCore.use([Navigation, Pagination]);

const Brands = props => {
    const { brands, isBrandPage } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);
    const { brandsData, brandsLoading, storeConfigData } = useBrands({ brands });
    const featuredBrandTextStyles = isBrandPage ? classes.featuredBrandPage : classes.featuredBrandHome;

    const categorytUrlSuffix = storeConfigData &&
        storeConfigData.storeConfig &&
        storeConfigData.storeConfig.category_url_suffix;

    const resizePhone = () => {
        window.onresize = function() {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    if (brandsLoading) {
        return (
            <div className={`${classes.shimmer} container`}>
                {Array.from({ length: isPhone ? 3 : 7 })
                    .fill(null)
                    .map((item, index) => (
                        <div key={index} className={classes.shimmerItem}>
                            <Shimmer
                                width={isPhone ? 6 : 10}
                                height={isPhone ? 3 : 5}
                            />
                        </div>
                    ))}
            </div>
        );
    }

    if (!brandsData) {
        return (
            <center>
                <span>
                    <FormattedMessage
                        id="brands.notFound"
                        defaultMessage="Not Found Brands"
                    />
                </span>
            </center>
        );
    }

    if (brandsData) {
        const brandsList = brandsData.getBrandList.featured;

        return (
            <div className={classes.root}>
                <Swiper
                    slidesPerView={3}
                    spaceBetween={5}
                    navigation={false}
                    pagination={true}
                    breakpoints={{
                        '360': {
                            slidesPerView: 3,
                            spaceBetween: 5
                        },
                        '480': {
                            slidesPerView: 4,
                            spaceBetween: 5
                        },
                        '1024': {
                            slidesPerView: 7,
                            spaceBetween: 5
                        }
                    }}
                >
                    {brandsList.map((item, index) => {
                        const urlKey = (item.category_url || item.category_url !== null) ?
                        `${item.category_url}${categorytUrlSuffix}` :
                        `/brand/${item.name.toLowerCase()}${categorytUrlSuffix}`;

                        return (
                            <SwiperSlide key={index} style={item.logo ? { display: 'block' } : { display: 'none' }}>
                                <div className={!isPhone ? 'container' : ''}>
                                    <Link style={{ textDecoration: 'none' }} className={classes.url} to={urlKey}>
                                        {
                                            item.logo ? (
                                                <img src={item.logo} width={isPhone ? '70%' : '100%'} />
                                            ) : null
                                        }
                                    </Link>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        );
    }
};

export default Brands;

Brands.propTypes = {
    classes: shape({
        root: string,
        shimmer: string,
        shimmerItem: string
    })
};
