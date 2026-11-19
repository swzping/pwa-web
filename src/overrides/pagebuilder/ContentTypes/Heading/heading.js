import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { arrayOf, string } from 'prop-types';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useMediaQuery } from '@magento/peregrine/lib/hooks/useMediaQuery';
import { useWindowSize } from '@magento/peregrine';
import resolveLinkProps from '@magento/peregrine/lib/util/resolveLinkProps';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { ChevronRightOutlined } from '@/assets/icons';
import defaultClasses from './heading.module.css';

const { matchMedia } = globalThis;

const Heading = props => {

    const { formatMessage } = useIntl();
    const backgroundElement = useRef(null);
    const moreButtonRef = useRef(null);
    const containerRef = useRef(null);
    const [bgImageStyle, setBgImageStyle] = useState(null);
    const [paddingRight, setPaddingRight] = useState(0);
    const [isSmallContainer, setIsSmallContainer] = useState(false);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const classes = useStyle(defaultClasses, props.classes);
    const viewAllText = formatMessage({ id: 'global.viewAll', defaultMessage: 'View all' })

    const {
        headingType = 'h2',
        text,
        textAlign,
        desktopImage,
        mobileImage,
        viewAllTitle = viewAllText,
        viewAllLink,
        backgroundSize = 'cover',
        backgroundPosition = 'center',
        backgroundRepeat = 'no-repeat',
        cssClasses = [],
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight: initialPaddingRight,
        paddingBottom,
        paddingLeft,
        color
    } = props;

    const HeadingType = `${headingType}`;
    const { styles: mediaQueryStyles } = useMediaQuery({});

    let image = desktopImage;
    if (mobileImage && matchMedia && matchMedia('(max-width: 768px)').matches) {
        image = mobileImage;
    }

    const dynamicStyles = {
        textAlign,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight: paddingRight || initialPaddingRight,
        paddingBottom,
        paddingLeft,
        ...(bgImageStyle && { backgroundImage: bgImageStyle }),
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
        color: color || (desktopImage ? '#fff' : '#000'),
    };

    useEffect(() => {
        if (image && backgroundElement.current) {
            setBgImageStyle(
                `url(${resourceUrl(image, {
                    type: 'image-wysiwyg',
                    quality: 85,
                    fit: 'cover'
                })})`
            );
        }
    }, [image]);

    useEffect(() => {
        if (moreButtonRef.current) {
            const buttonWidth = moreButtonRef.current.offsetWidth;
            setPaddingRight(buttonWidth + 10);
        }
    }, [moreButtonRef.current, isSmallContainer]);

    useEffect(() => {
        if (isMobile && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const pageWidth = windowSize.innerWidth;
            setIsSmallContainer(containerWidth < pageWidth / 2);
        }
    }, [isMobile, windowSize]);

    return (
        <div
            ref={containerRef}
            className={[
                classes.root,
                image ? classes.hasBackground : '',
            ].join(' ')}
            style={{marginTop: '12px'}}
        >
            {(viewAllLink && <Link {...resolveLinkProps(viewAllLink)} ref={moreButtonRef}
                    className={[
                        classes.moreButton,
                        isSmallContainer ? classes.smallContainerButton : ''
                    ].join(' ')}>
                    <span className={classes.buttonText}>{viewAllTitle || 'Show All'}</span>
                    <div className={classes.arrowWrapper}>
                        <ChevronRightOutlined  size={28} color='#fff' className={classes.showIcon}/>
                    </div>
                </Link>

            )}
            <HeadingType
                ref={backgroundElement}
                style={{ ...dynamicStyles, ...mediaQueryStyles, height: '4vw',borderRadius: '16px 16px 0 0' }}
                className={[
                    classes.head,
                    ...cssClasses
                ].join(' ')}
            >
                <span className={classes.text} style={{paddingRight: 2}}>{text}</span>
            </HeadingType>
        </div>
    );
};

Heading.propTypes = {
    headingType: string.isRequired,
    text: string.isRequired,
    textAlign: string,
    desktopImage: string,
    mobileImage: string,
    backgroundSize: string,
    backgroundPosition: string,
    backgroundRepeat: string,
    marginTop: string,
    marginRight: string,
    marginBottom: string,
    marginLeft: string,
    paddingTop: string,
    paddingRight: string,
    paddingBottom: string,
    paddingLeft: string,
    cssClasses: arrayOf(string)
};

export default Heading;
