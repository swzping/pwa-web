import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { shape, string, number, bool, oneOf } from 'prop-types';
import { Swiper as SwiperReact, SwiperSlide } from 'swiper/react';
import SwipeCore, { Autoplay, Navigation, Pagination } from 'swiper';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from './swiper.module.css';

import 'swiper/swiper.min.css';

SwipeCore.use([Autoplay, Navigation, Pagination]);

// 定义不同的布局模式及响应式 breakpoints
const LayoutStyles = {
    '0': {
        0: {
            slidesPerView: 1,
            spaceBetween: 4
        },
        768: {
            slidesPerView: 1,
            spaceBetween: 16
        }
    },
    '1': {
        0: {
            slidesPerView: 1.25,
            spaceBetween: 4
        },
        768: {
            slidesPerView: 1,
            spaceBetween: 16
        }
    },
    '2': {
        0: {
            slidesPerView: 1.33,
            spaceBetween: 4
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 16
        }
    },
    '3': {
        0: {
            slidesPerView: 2.25,
            spaceBetween: 4
        },
        768: {
            slidesPerView: 3,
            spaceBetween: 16
        }
    },
    '4': {
        0: {
            slidesPerView: 2.25,
            spaceBetween: 4
        },
        768: {
            slidesPerView: 4,
            spaceBetween: 16
        }
    }
};

// 处理Behavior default、options 不同形态配置
const getBehaviorSetting = (setting, { mode, behavior, totalSlides }) => {
    if (!mode) {
        return setting;
    }

    if(behavior === 'options') {
        const isPerViewSame = mode === totalSlides
        if (mode === 4 && isPerViewSame) {
            setting.rows = 2;
            setting.breakpoints['0'].slidesPerView = 2
        } else if (mode === 3 && isPerViewSame) {
            setting.breakpoints['0'].slidesPerView = 1.33;
        } else if (mode === 2 && !isPerViewSame) {
            setting.breakpoints['0'].slidesPerView = 2.25;
        } else if (mode === 1 && !isPerViewSame) {
            setting.breakpoints['0'].slidesPerView = 1;
        }
    }

    // 解决当只有一个时，展示异常问题
    if(mode === 1 && totalSlides === 1) {
        setting.breakpoints['0'].slidesPerView = 1;
    }

    return setting;
};

const Swiper = (props) => {
    const {
        mode,
        behavior,
        autoplaySpeed,
        autoplay,
        dots: pagination,
        arrows: navigation,
        infinite: loop,
        breakpoints,
        rows = 1,
        children,
        isCampaignHighlight,
        ...rest
    } = props;
    const totalSlides = React.Children.count(children);
    // 处理特殊的swiper布局
    if (isCampaignHighlight) {
        Object.keys(LayoutStyles).forEach(key => {
            LayoutStyles[key]['768'].spaceBetween = 0
            LayoutStyles[key]['0'].spaceBetween = 0
            if (key ==  3 || key == 4) {
                LayoutStyles[key]['0'].slidesPerView = 2.5
            }
        })
        
    }
    const initialSlidesPerView = mode !== undefined ? LayoutStyles[mode][0].slidesPerView : 1;
    const initialShowNavigation = totalSlides > initialSlidesPerView;
    const [currentSlidesPerView, setCurrentSlidesPerView] = useState(0);
    const [showNavigation, setShowNavigation] = useState(initialShowNavigation);
    const [allowMoveRight, setAllowMoveRight] = useState(true);
    const swiperInstanceRef = useRef(null);
    const [shouldRender, setShouldRender] = useState(false);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const classes = useStyle(defaultClasses, props.classes);
    const groupChildren = (children, totalSlides, rows) => {
        if (rows <= 1) return children;

        const grouped = [];

        const groupSize = Math.ceil(totalSlides / rows);

        for (let i = 0; i < groupSize; i++) {
            const group = [];

            for (let j = 0; j < rows; j++) {
                const childIndex = i + j * groupSize;
                if (childIndex < totalSlides) {
                    group.push(children[childIndex]);
                }
            }
            grouped.push(group);
        }

        return grouped;
    };

    const handleNavigationVisibility = (swiper) => {
        const updatedSlidesPerView = swiper.params.slidesPerView;
        setAllowMoveRight(!Number.isInteger(updatedSlidesPerView))
        setCurrentSlidesPerView(updatedSlidesPerView);
        setShowNavigation(totalSlides > updatedSlidesPerView);
    };

    const swiperSettings = useMemo(() => getBehaviorSetting({
        rows,
        autoplay: autoplay ? {
            delay: autoplaySpeed,
            disableOnInteraction: false
        } : false,
        pagination: (showNavigation && pagination) ? { clickable: true } : false,
        navigation: (showNavigation && navigation) || false,
        loop,
        lazy: true,
        breakpoints: mode ? LayoutStyles[mode] : breakpoints,
        onSwiper: (swiper) => {
            if (!swiperInstanceRef.current) {
                swiperInstanceRef.current = swiper;
                handleNavigationVisibility(swiper);
            }
        },
        allowTouchMove: showNavigation,
        ...rest,
    }, { mode, behavior, totalSlides}),
    [mode, behavior, totalSlides, rows, autoplay, autoplaySpeed, pagination, navigation, loop, showNavigation, breakpoints, rest]);

    const groupedChildren = groupChildren(React.Children.toArray(children), totalSlides, isMobile ? swiperSettings.rows : rows);

    useLayoutEffect(() => {
        if (!shouldRender) {
            setShouldRender(true);
        }
    }, []);

    useLayoutEffect(() => {
        if (swiperInstanceRef.current) {
            handleNavigationVisibility(swiperInstanceRef.current);
            swiperInstanceRef.current.update();
        }
    }, [totalSlides, currentSlidesPerView]);

    if (!shouldRender) return null;

    return (
        <div className={[
            classes.root,
            allowMoveRight ? 'allow-move-right' : '',
            showNavigation && pagination ? classes.paginationDots : '',
            currentSlidesPerView > 1 && showNavigation && navigation ? classes.navigation : '',
        ].join(' ')}>
            <SwiperReact {...swiperSettings}>
                {  (isMobile ? swiperSettings.rows : rows) > 1
                    ? groupedChildren.map((group, index) => (
                        <SwiperSlide key={index}>
                            <div className={classes.groupContainer}>
                                {group.map((child, childIndex) => (
                                    <div key={childIndex} className={classes.childContainer}>
                                        {child}
                                    </div>
                                ))}
                            </div>
                        </SwiperSlide>
                    ))
                    : React.Children.map(groupedChildren, (child, index) => (
                        <SwiperSlide key={index}>{child}</SwiperSlide>
                    ))
                }
            </SwiperReact>
        </div>
    );
};

Swiper.propTypes = {
    classes: shape({
        root: string
    }),
    mode: number,
    behavior: oneOf(['default']),
    autoplay: bool,
    autoplaySpeed: number,
    dots: bool,
    arrows: bool,
    breakpoints: shape({}),
    rows: number,
};

export default Swiper;
