// Preserve Swiper 6 imports and class names while using the patched runtime.
import React, { Children, forwardRef } from 'react';
import SwiperCore from 'swiper/swiper.mjs';
import { Swiper as SwiperReact, SwiperSlide } from 'swiper/swiper-react.mjs';
import Autoplay from 'swiper/modules/autoplay.mjs';
import FreeMode from 'swiper/modules/free-mode.mjs';
import Navigation from 'swiper/modules/navigation.mjs';
import Pagination from 'swiper/modules/pagination.mjs';

SwiperCore.use([Autoplay, FreeMode, Navigation, Pagination]);

const Swiper = forwardRef(({ className = '', direction = 'horizontal', navigation, ...props }, ref) => {
    const maxPerView = Math.max(
        Number(props.slidesPerView) || 1,
        ...Object.values(props.breakpoints || {}).map(point => Number(point.slidesPerView) || 1),
    );
    const canLoop = Children.count(props.children) >= Math.ceil(maxPerView) + (props.slidesPerGroup || 1);
    // Swiper 12 no longer clones slides. Rewind small collections instead.
    return (
        <SwiperReact
            {...props}
            loop={props.loop && canLoop}
            rewind={props.rewind || (props.loop && !canLoop)}
            ref={ref}
            direction={direction}
            className={`swiper-container swiper-container-${direction} ${className}`}
            navigation={
                navigation ? { addIcons: false, ...(typeof navigation === 'object' ? navigation : {}) } : navigation
            }
        />
    );
});
Swiper.displayName = 'Swiper';

export { Swiper, SwiperSlide, Autoplay, Navigation, Pagination };
export default SwiperCore;
