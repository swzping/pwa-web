import React, { useMemo } from 'react';
import { domToReact } from 'html-react-parser';
import { shape, string } from 'prop-types';
import Swiper from '@/modules/custom-modules/components/Swiper';
import classNames from 'classnames';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from './smallIcon.module.css';

const defaultBreakpoints = {
    0: {
        slidesPerView: 4,
        slidesPerGroup: 4,
        spaceBetween: 24,
    },
    768: {
        slidesPerView: 6,
        slidesPerGroup: 6,
        spaceBetween: 16,
    }
}

const brandsBreakpoints = {
    0: {
        slidesPerView: 4.33,
        spaceBetween: 4,
    },
    768: {
        slidesPerView: 7,
        slidesPerGroup: 7,
        spaceBetween: 8,
    }
}

const SmallIcon = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { domNode, dynamicStyles, cssClasses } = props;
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    const isBrands = domNode.attribs.class?.includes('brands');
    const isPlpBrands = domNode.attribs.class?.includes('plp-brands');
    let extractedChildren = []

    const defaultBreakpoints = {
    0: {
        slidesPerView: 4,
        slidesPerGroup: 4,
        spaceBetween: isPlpBrands ? 10 : 24,
    },
    768: {
        slidesPerView: 6,
        slidesPerGroup: 6,
        spaceBetween: 16,
    }
}

const brandsBreakpoints = {
    0: {
        slidesPerView: 4.33,
        spaceBetween: 4,
    },
    768: {
        slidesPerView: 7,
        slidesPerGroup: 7,
        spaceBetween: 8,
    }
}

    const smallIconList = domNode.children.filter(
        child => child.type === 'tag' && child.attribs && child.attribs.class === 'small-icon__item'
    );

    const wrapperNode = domNode.children.find(
        child => child.type === 'tag' && child.attribs && child.attribs.class?.includes('catalog-wrapper')
    );

    if(smallIconList.length) {
        extractedChildren = smallIconList
    }

    if (wrapperNode) {
        extractedChildren =
            wrapperNode?.children.filter(child => {
                return (
                    child.type === 'tag' &&
                    child.attribs &&
                    child.attribs.class?.includes('item-catalog-wrapper') &&
                    !child.attribs.class?.includes('hide')
                );
            }) || [];
    }
    const numberOfIcons = extractedChildren.length;

    // 如果是图标数量超过10个，则展示 Carousel
    const shouldShowCarousel = useMemo(() => {
        return numberOfIcons > 6;
    }, [numberOfIcons]);

    // 非Carousel场景的布局逻辑
    const renderNonCarouselLayout = () => {
        let gridClasses = '';

        if (isMobile) {
            if (numberOfIcons > 6) {
                gridClasses = classes.grid;
            } else {
                gridClasses = classNames(
                    classes.grid,
                    {
                        [classes.gridTwoRows]: numberOfIcons > 5,
                        [classes.gridFourColumns]: numberOfIcons === 8 || numberOfIcons === 7,
                        [classes.gridThreeColumns]: numberOfIcons === 6,
                        [classes.oneRow]: numberOfIcons <= 5
                    }
                );
            }
        } else {
            gridClasses = classNames(classes.grid, numberOfIcons <= 6 && classes.oneRow);
        }

        return (
            <div className={gridClasses}>
                {extractedChildren.map((child, key) => (
                    <div key={key} className={classes.item_wrapper}>{domToReact([child])}</div>
                ))}
            </div>
        );
    };

    const dots = useMemo(() => {
        if(isPlpBrands) {
            return true
        }
        if (isBrands) {
            return false;
        }
        return isMobile;
    }, [isBrands, isMobile]);

    const getSlidesToShow = () => {
        if (isMobile) {
            return 5;
        }
        if (numberOfIcons > 10) {
            return 10;
        }
        return numberOfIcons;
    };

    const getRows = () => {
        if(isPlpBrands && !isMobile) {
            return 2;
        }

        if (isBrands) {
            return 1;
        }
        if (isMobile) {
            return 1;
        }
        // if (numberOfIcons > 10 && numberOfIcons < 20) {
        //     return 1;
        // }
        return 2;
    };

    const defaultSettings = {
        dots,
        arrows: isMobile ? false : true,
        rows: getRows(),
        breakpoints: isBrands && !isPlpBrands ? brandsBreakpoints : defaultBreakpoints
    };

    const parseDataSettings = () => {
        const settingsString = domNode.attribs['data-settings'];
        let parsedSettings = {};

        if (settingsString) {
            try {
                parsedSettings = JSON.parse(settingsString.replace(/'/g, '"'));
            } catch (error) {
                console.warn('Invalid data-settings JSON:', error);
            }
        }

        return parsedSettings;
    };

    const parsedSettings = parseDataSettings();
    const smallIconSettings = { ...defaultSettings, ...parsedSettings };

    const domNodeClasses = domNode.attribs.class ? domNode.attribs.class.split(' ') : [];
    const mappedClasses = domNodeClasses.map(className => classes[className] || className);
    const combinedClasses = classNames(classes.root, ...cssClasses, ...mappedClasses);

    return (
        <div className={combinedClasses} style={dynamicStyles}>
            {shouldShowCarousel ? (
                <Swiper {...smallIconSettings}>
                    {extractedChildren.map((child, key) => (
                        <div key={key}>
                            {domToReact([child])}
                        </div>
                    ))}
                </Swiper>
            ) : (
                renderNonCarouselLayout()
            )}
        </div>
    );
};

SmallIcon.propTypes = {
    classes: shape({
        root: string,
        grid: string,
        gridTwoRows: string,
        centerRow: string,
    }),
};

export default SmallIcon;
