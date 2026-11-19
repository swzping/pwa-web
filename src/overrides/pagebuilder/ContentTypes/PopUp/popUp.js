import React, { useState, useEffect } from 'react';
import classes from './popUp.module.css';
import { Vector } from '@/assets/icons';
import { useWindowSize } from '@magento/peregrine';
import { trackHomepagePopUpClick } from '@/utils/track';

const PopUp = ({ items = [] }) => {
    console.log('items', items);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('hasShownPopUpAd');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        if (!sessionStorage.getItem('hasShownPopUpAd')) {
            setOpen(true);
            sessionStorage.setItem('hasShownPopUpAd', '1');
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    if (!open || !items.length) return null;
    const { link, image, mobileImage } = items[0];
    const imagePic = isMobile ? mobileImage : image;

    const handleAdClick = () => {
        trackHomepagePopUpClick({ jumpUrl: link, isClosed: 'enter' });
    };
    const handleClose = () => {
        setOpen(false);
        trackHomepagePopUpClick({ jumpUrl: link, isClosed: 'close' });
    };

    return (
        <div className={classes.overlay}>
            <div className={classes.dialog}>

                    <div className='imgdiv'>
                    <div className={classes.closeBtn}>
                        <button onClick={handleClose} aria-label="x">
                            <Vector alt="x" />
                        </button>
                    </div>
                        <a href={link} className={classes.imgLink} onClick={handleAdClick}>
                        <img
                            src={imagePic}
                            alt="ads"
                            className={classes.img}
                        />
                    </a>
                </div>

            </div>
        </div>
    );
};

export default PopUp;
