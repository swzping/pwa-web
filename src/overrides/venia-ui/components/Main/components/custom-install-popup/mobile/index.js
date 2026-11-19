import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './styles.module.css';
import TagManager from 'react-gtm-module';

const PopupInstalation = () => {
    const classes = useStyle(defaultClasses);

    const closePopup = () => {
        const el = document.getElementById('popup-mobile__install');
        // hidden popup
        if (el) {
            el.style.display = 'none';
        }

        const date = new Date();
        // add a day
        date.setDate(date.getDate() + 1);
        localStorage.setItem('hideInstallPopup', true);
        localStorage.setItem('expiredHideInstallPopup', date.getDate());
    };

    const onClick = () => {
        const timestamp = Date.now();
        const identifier = `${(Math.floor(Math.random() * 100) * Math.floor(Math.random() * 100))}_${timestamp}`;
        const dataLayer = {
            event: 'countPopupInstallation',
            eventCategory: 'Count Popup Installation',
            eventAction: 'Installed',
            eventLabel: 'installPWA',
            eventValue: identifier,
        };
        TagManager.dataLayer({ dataLayer });
    };
    return (
        <div id="popup-mobile__install" className={`${classes.root} popup-mobile__install`}>
            <div className={classes.wrapper}>
                <div>
                    <span
                        className={classes.close}
                        onClick={() => closePopup()}
                    >
                        x
                    </span>

                    <img
                        className={classes.logo}
                        alt="logo"
                        src="/venia-static-assets/images/logo_mobile.png"
                    />
                </div>
                <div className={classes.infoTitle}>
                    <div className={classes.title}>DOWNLOAD MOBILE APP</div>
                    <p className={classes.subtitle}>
                        for better shopping experience
                    </p>
                </div>
            </div>
            <div>
                <button className={classes.btn} id="btn-install__mobile" onClick={onClick}>
                    Install
                </button>
            </div>
        </div>
    );
};

export default PopupInstalation;
