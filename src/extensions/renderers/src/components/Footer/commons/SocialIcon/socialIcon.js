import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './styles.module.css';

const SocialIcon = () => {
    const classes = useStyle(defaultClasses);

    return (
        <ul className={classes.root}>
            <li>
                <img
                    src="/venia-static-assets/icons/socials/instagram.svg"
                    width="40"
                />
            </li>
            <li>
                <img
                    src="/venia-static-assets/icons/socials/facebook.svg"
                    width="40"
                />
            </li>
            <li>
                <img
                    src="/venia-static-assets/icons/socials/twitter.svg"
                    width="40"
                />
            </li>
            <li>
                <img
                    src="/venia-static-assets/icons/socials/youtube.svg"
                    width="40"
                />
            </li>
            <li>
                <img
                    src="/venia-static-assets/icons/socials/tiktok.svg"
                    width="40"
                />
            </li>
        </ul>
    );
};

export default SocialIcon;
