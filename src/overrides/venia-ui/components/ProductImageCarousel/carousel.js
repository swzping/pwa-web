import React, { useMemo } from 'react';
import { arrayOf, bool, number, shape, string } from 'prop-types';
import { useIntl } from 'react-intl';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon
} from 'react-feather';

import { transparentPlaceholder } from '@magento/peregrine/lib/util/images';
import { useProductImageCarousel } from '@magento/peregrine/lib/talons/ProductImageCarousel/useProductImageCarousel';

import { useStyle } from '@magento/venia-ui/lib/classify';
import AriaButton from '@magento/venia-ui/lib/components/AriaButton';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Image from '@magento/venia-ui/lib/components/Image';
import defaultClasses from './carousel.module.css';
import Thumbnail from './thumbnail';
import VideoPlayer from './../ProductImageViewer/index'
import {Remark} from './remark'
import DiscountRibbon from '../../../../modules/swift-pwa-ui/components/DiscountRibbon';
import { useLocalStorageListener } from '../../../../helpers/hooks'
import { getEffectiveStockStatus } from './stockStatus';

const IMAGE_WIDTH = 640;

/**
 * Carousel component for product images
 * Carousel - Component that holds number of images
 * where typically one image visible, and other
 * images can be navigated through previous and next buttons
 *
 * @typedef ProductImageCarousel
 * @kind functional component
 *
 * @param {props} props
 *
 * @returns {React.Element} React carousel component that displays a product image
 */
const ProductImageCarousel = props => {
    const { images, productDetails, currentStockStatus, isFlashSaleActive } = props;
    // app ProductDetail parity — discount ribbon beside the flash badge
    const showDiscountRibbon = Number(productDetails?.discount_percentage) > 0;
    const { formatMessage } = useIntl();
    const talonProps = useProductImageCarousel({
        images,
        imageWidth: IMAGE_WIDTH
    });
    const currentSavaIsEnd = useLocalStorageListener('savaIsEnd')
    const showFlashSale = isFlashSaleActive === undefined
        ? productDetails?.is_flash_sale === 1 && !currentSavaIsEnd
        : isFlashSaleActive;

    const {
        currentImage,
        activeItemIndex,
        altText,
        handleNext,
        handlePrevious,
        handleThumbnailClick,
        sortedImages
    } = talonProps;

    // create thumbnail image component for every images in sorted order
    const thumbnails = useMemo(
        () =>
            sortedImages.map((item, index) => (
                <Thumbnail
                    key={item.id}
                    item={item}
                    itemIndex={index}
                    isActive={activeItemIndex === index}
                    onClickHandler={handleThumbnailClick}
                />
            )),
        [activeItemIndex, handleThumbnailClick, sortedImages]
    );

    const classes = useStyle(defaultClasses, props.classes);

    let image;
    if (currentImage.file) {
        image = (
            <Image
                alt={altText}
                classes={{
                    image: classes.currentImage,
                    root: classes.imageContainer
                }}
                resource={currentImage.file}
                width={IMAGE_WIDTH}
            />
        );
    } else {
        image = (
            <Image
                alt={altText}
                classes={{
                    image: classes.currentImage_placeholder,
                    root: classes.imageContainer
                }}
                src={transparentPlaceholder}
            />
        );
    }

    const previousButton = formatMessage({
        id: 'productImageCarousel.previousButtonAriaLabel',
        defaultMessage: 'Previous Image'
    });

    const nextButton = formatMessage({
        id: 'productImageCarousel.nextButtonAriaLabel',
        defaultMessage: 'Next Image'
    });

    const chevronClasses = { root: classes.chevron };

    const videoExtensions = [
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
        '.m4v', '.3gp', '.ogg', '.ogv', '.qt', '.mpeg', '.mpg',
        '.mpe', '.mpv', '.m2v', '.m4p', '.m4v', '.f4v', '.f4p',
        '.f4a', '.f4b'
    ];
    const lowerUrl = currentImage?.label ? currentImage?.label?.toLowerCase() : '';
    const isVideo = videoExtensions.some(ext => lowerUrl?.endsWith(ext));
    const effectiveStockStatus = getEffectiveStockStatus({
        currentStockStatus,
        productDetails
    });
    return (
        <div className={classes.root}>
            <div className={classes.thumbnailList}>{thumbnails}</div>
                {!isVideo ? <div className={classes.carouselContainer}>
                {/* <AriaButton
                    className={classes.previousButton}
                    onPress={handlePrevious}
                    aria-label={previousButton}
                    type="button"
                >
                    <Icon
                        classes={chevronClasses}
                        src={ChevronLeftIcon}
                        size={40}
                    />
                </AriaButton> */}
                {image}
                {/* <AriaButton
                    className={classes.nextButton}
                    onPress={handleNext}
                    aria-label={nextButton}
                    type="button"
                >
                    <Icon
                        classes={chevronClasses}
                        src={ChevronRightIcon}
                        size={40}
                    />
                </AriaButton> */}
                {
                    (showFlashSale) || showDiscountRibbon ? (
                        <div style={{ position: 'absolute', top: 15, left: 20, margin: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                            {showFlashSale && <img style={{ margin: 0, borderRadius: 0, width: 67 }} src='/venia-static-assets/images/flashProduct.png' alt="" />}
                            {showDiscountRibbon && <DiscountRibbon percent={productDetails.discount_percentage} width={67} />}
                        </div>
                    ) : null
                }
                { effectiveStockStatus === "OUT_OF_STOCK"  && <div className={classes.outOfStock}>Out of Stock</div>}
                {effectiveStockStatus == "OUT_OF_STOCK" && <Remark />}
            </div> : <VideoPlayer
                src={`media/catalog/product${currentImage.file}`}
                is_flash_sale={showFlashSale ? 1 : 0}
                discount_percentage={productDetails?.discount_percentage}
                stock_status={productDetails?.stock_status}
            />}
        </div>
    );
};

/**
 * Props for {@link ProductImageCarousel}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the
 * ProductImageCarousel component
 * @property {string} classes.currentImage classes for visible image
 * @property {string} classes.imageContainer classes for image container
 * @property {string} classes.nextButton classes for next button
 * @property {string} classes.previousButton classes for previous button
 * @property {string} classes.root classes for root container
 * @property {Object[]} images Product images input for Carousel
 * @property {bool} images[].disabled Is image disabled
 * @property {string} images[].file filePath of image
 * @property {string} images[].id the id of the image
 * @property {string} images[].label label for image
 * @property {string} images[].position Position of image in Carousel
 */
ProductImageCarousel.propTypes = {
    classes: shape({
        carouselContainer: string,
        currentImage: string,
        currentImage_placeholder: string,
        imageContainer: string,
        nextButton: string,
        previousButton: string,
        root: string
    }),
    images: arrayOf(
        shape({
            label: string,
            position: number,
            disabled: bool,
            file: string.isRequired,
            id: number.isRequired
        })
    ).isRequired
};

export default ProductImageCarousel;
