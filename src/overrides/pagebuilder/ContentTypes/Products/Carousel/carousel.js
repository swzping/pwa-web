import React, { useMemo } from 'react';
import SlickSlider from 'react-slick';
import GalleryItem from '@magento/venia-ui/lib/components/Gallery/item';
import Swiper from '@/modules/custom-modules/components/Swiper';
import { useCarousel } from '@magento/pagebuilder/lib/ContentTypes/Products/Carousel/useCarousel';
import { trackHomeCommonModuleClick } from '@/utils/track';
import { useGallery } from '../../../../../overrides/peregrine/talons/Gallery/useGallery';
import ProductQuickviewDialog from '../../../../../modules/swift-pwa-ui/components/ProductQuickviewDialog';

const Carousel = props => {
    const { settings, items } = props;

    const talonProps = useGallery();
    const {
        handleQuickviewClose,
        handleQuickviewOpen,
        isOpenQuickview,
        quickviewDataUrlKey,
    } = talonProps;

    const { storeConfig } = useCarousel();
    const handleTrackClick = (item, sortBy) => {
        trackHomeCommonModuleClick({
            contentType: 'Carousel',
            title: item.name,
            sortIndex: sortBy + 1,
            isTrack: true
        })
    }

    const galleryItems = items.map((item, index) => {
        return (
            <div key={index} onClick={() => handleTrackClick(item, index)}>
                <GalleryItem
                    key={index}
                    item={item}
                    storeConfig={storeConfig}
                    onClickQuickviewAction={handleQuickviewOpen}/>
            </div>
        );
    });

    // quick view modal
    const maybeQuickviewDialog = useMemo(() => {
        if (isOpenQuickview) {
            return (
                <ProductQuickviewDialog
                    storeConfig={storeConfig}
                    urlKey={quickviewDataUrlKey}
                    onClose={handleQuickviewClose}
                />
            );
        }

        return null;
    }, [
        isOpenQuickview,
        quickviewDataUrlKey,
        handleQuickviewClose,
    ]);

    return (
        <>
            <Swiper {...settings}>
                {galleryItems}
            </Swiper>
            {maybeQuickviewDialog}
        </>
    );
};

export default Carousel;
