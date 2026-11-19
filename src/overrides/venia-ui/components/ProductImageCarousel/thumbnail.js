import React, { useMemo } from 'react';
import { bool, func, number, shape, string } from 'prop-types';

import { transparentPlaceholder } from '@magento/peregrine/lib/util/images';
import { useWindowSize } from '@magento/peregrine';
import { useThumbnail } from '@magento/peregrine/lib/talons/ProductImageCarousel/useThumbnail';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './thumbnail.module.css';
import Image from '@magento/venia-ui/lib/components/Image';
import VideoThumbnail from './videoThumbnail'

const DEFAULT_THUMBNAIL_HEIGHT = 170;
const DEFAULT_THUMBNAIL_WIDTH = 135;

/**
 * The Thumbnail Component is used for showing thumbnail preview image for ProductImageCarousel
 * Shows up only in desktop devices
 *
 * @typedef Thumbnail
 * @kind functional component
 *
 * @param {props} props
 *
 * @returns {React.Element} React thumbnail component that displays product thumbnail
 */
const Thumbnail = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const {
        isActive,
        item: { file, label, media_type },
        onClickHandler,
        itemIndex
    } = props;

    const talonProps = useThumbnail({
        onClickHandler,
        itemIndex
    });

    const { handleClick } = talonProps;
    const selectedItem = isActive ? 'Current Image' : 'Next Image';
    const windowSize = useWindowSize();
    const isDesktop = windowSize.innerWidth >= 1024;
    const videoExtensions = [
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', 
        '.m4v', '.3gp', '.ogg', '.ogv', '.qt', '.mpeg', '.mpg',
        '.mpe', '.mpv', '.m2v', '.m4p', '.m4v', '.f4v', '.f4p',
        '.f4a', '.f4b'
    ];
    const lowerUrl = label ? label?.toLowerCase() : '';
    const isVideo = videoExtensions.some(ext => lowerUrl?.endsWith(ext));

    const thumbnailImage = useMemo(() => {
        if (!isDesktop) {
            return null;
        }

        return file ? (
            !isVideo ?
            <Image
                alt={label}
                classes={{ image: classes.image }}
                height={DEFAULT_THUMBNAIL_HEIGHT}
                resource={file}
                width={DEFAULT_THUMBNAIL_WIDTH}
            /> : isVideo ? <VideoThumbnail videoUrl={`media/catalog/product${file}`} classes={{ image: classes.image }} /> : null
        ) : (
            <Image
                alt={label}
                classes={{ image: classes.image }}
                src={transparentPlaceholder}
            />
        );
    }, [file, isDesktop, label, classes.image]);

    return (
        <span
            className={isActive ? classes.rootSelected : classes.root}
            onClick={handleClick}
            aria-label={selectedItem}
            // style={{ position: 'relative' }}
        >
            {thumbnailImage}
            {/* { media_type && <span className={classes.videoPlay}>
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
<circle cx="25" cy="25" r="25" fill="black" fill-opacity="0.52"/>
<path d="M34.7043 26.325C35.6953 25.6332 35.696 24.1665 34.7056 23.4738L23.5387 15.6629C21.5112 14.2448 18.7286 15.7101 18.7509 18.1843L18.8123 25.0022L18.7518 31.5966C18.7291 34.0696 21.5093 35.5357 23.5372 34.1201L34.7043 26.325Z" fill="white"/>
</svg>
            </span>} */}
        </span>
    );
};

/**
 * Props for {@link Thumbnail}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the Thumbnail component
 * @property {string} classes.root classes for root container
 * @property {string} classes.rootSelected classes for the selected thumbnail item
 * @property {bool} isActive is image associated is active in carousel
 * @property {string} item.label label for image
 * @property {string} item.file filePath of image
 * @property {number} itemIndex index number of thumbnail
 * @property {func} onClickHandler A callback for handling click events on thumbnail
 */
Thumbnail.propTypes = {
    classes: shape({
        root: string,
        rootSelected: string
    }),
    isActive: bool,
    item: shape({
        label: string,
        file: string.isRequired
    }),
    itemIndex: number,
    onClickHandler: func.isRequired
};

export default Thumbnail;
