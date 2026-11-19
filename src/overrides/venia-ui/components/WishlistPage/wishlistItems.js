import React, { Fragment, useMemo } from 'react';
import { useWishlistItems } from '@magento/peregrine/lib/talons/WishlistPage/useWishlistItems';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './wishlistItems.module.css';
import WishlistItem from './wishlistItem';
import AddToCartDialog from '@magento/venia-ui/lib/components/AddToCartDialog';

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

    return (
        <Fragment>
            <div className={rootClass}>{rendererItems}</div>
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