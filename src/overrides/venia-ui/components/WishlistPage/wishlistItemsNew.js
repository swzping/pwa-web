import React, { Fragment, useMemo, useRef } from 'react';
import { useWishlistItems } from '@magento/peregrine/lib/talons/WishlistPage/useWishlistItems';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './wishlistItemsNew.module.css';
import WishlistItem from './wishlistItemNew';
import AddToCartDialog from '@magento/venia-ui/lib/components/AddToCartDialog';
import { useWindowSize } from '@magento/peregrine';

import { Swiper, SwiperSlide } from "swiper/react";
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

const WishlistItems = props => {
    const { items, wishlistId, isAccountInfo } = props;

    const talonProps = useWishlistItems();
    const {
        activeAddToCartItem,
        handleCloseAddToCartDialog,
        handleOpenAddToCartDialog
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const scrollContainerRef = useRef(null);

    const itemElements = useMemo(() => {
        return items.map(item => {
            return (
                <WishlistItem
                    key={item.id}
                    item={item}
                    onOpenAddToCartDialog={handleOpenAddToCartDialog}
                    wishlistId={wishlistId}
                />
            );
        });
    }, [handleOpenAddToCartDialog, items, wishlistId]);

    const accountItemElements = useMemo(() => {
        return (
            <Swiper
                slidesPerView={2} 
                spaceBetween={10}
                freeMode
                breakpoints={{
                    "360": {
                        "slidesPerView": 1,
                        "spaceBetween": 10
                    },
                    "480": {
                        "slidesPerView": 2,
                        "spaceBetween": 15
                    },
                    "1024": {
                        "slidesPerView": 4,
                        "spaceBetween": 20
                    }
                }}
            >
                {
                    items.map(item => {
                        return (
                            <SwiperSlide>
                                <WishlistItem
                                    key={item.id}
                                    item={item}
                                    onOpenAddToCartDialog={handleOpenAddToCartDialog}
                                    wishlistId={wishlistId}
                                    isAccountInfo={isAccountInfo}
                                />
                            </SwiperSlide>
                        );
                    })
                }
            </Swiper>
        )
    }, [handleOpenAddToCartDialog, items, wishlistId]);

    const rootClass = isAccountInfo ? classes.accountRoot : classes.root;
    const rendererItems = isAccountInfo ? accountItemElements : itemElements

    const handleScroll = (direction) => {
        if (!scrollContainerRef.current) return;
        // const firstCouponCard = scrollContainerRef.current.querySelector('.wishlistItem-item');
        // if (!firstCouponCard) return;

        const cardWidth = 160;
        scrollContainerRef.current.scrollBy({
            left: direction === 'next' ? cardWidth : -cardWidth,
            behavior: 'smooth'
        });
    };
    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {!isMobile && (
                    <button className="scroll-btn prev" onClick={() => handleScroll('prev')} disabled={false}>
                        <svg className="icon-arrow" viewBox="0 0 24 24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                        </svg>
                    </button>
                )}

                <div className={classes.wishlistScroll} ref={scrollContainerRef}>
                    <div className={classes.wishlistScrollInner}>
                        { items.map(item => {
                            return <WishlistItem
                                    key={item.id}
                                    item={item}
                                    onOpenAddToCartDialog={handleOpenAddToCartDialog}
                                    wishlistId={wishlistId}
                                    isAccountInfo={isAccountInfo}
                                />
                        })}
                    </div>
                </div>
                
                {!isMobile && (
                    <button className="scroll-btn next" onClick={() => handleScroll('next')} disabled={false}>
                        <svg className="icon-arrow" viewBox="0 0 24 24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                        </svg>
                    </button>
                )}
            </div>
            {/* <div className={rootClass}>{rendererItems}</div> */}
            {/* <div className={classes.root}>{itemElements}</div> */}
            {/* <div className={classes.accountRoot}>{accountItemElements}</div> */}
            <AddToCartDialog
                item={activeAddToCartItem}
                onClose={handleCloseAddToCartDialog}
            />
        </Fragment>
    );
};

export default WishlistItems;
