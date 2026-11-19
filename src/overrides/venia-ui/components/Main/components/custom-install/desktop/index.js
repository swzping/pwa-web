import React from 'react';
import Button from '@magento/venia-ui/lib/components/Button';
import styles from './style.module.css';
import TagManager from 'react-gtm-module';
const CustomInstallDesktop = () => {
    const closePopup = () => {
        const el = document.getElementById('popup-desktop__install');
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
        <div
            className={`${styles.root} popup-desktop__install`}
            id="popup-desktop__install"
        >
            <div className={styles.popupDesktop}>
                <button className={styles.buttonClose} onClick={closePopup}>
                    x
                </button>
                <img
                    className={styles.logo}
                    src="/venia-static-assets/images/logo-round.png"
                />
                <div>
                    <p className={styles.textTop}>DOWNLOAD MOBILE APP</p>
                    <p className={styles.textBottom}>
                        for better shopping experience
                    </p>
                </div>
                <Button
                    className={`${styles.btnInstall} btn-install`}
                    id="btn-install"
                    onClick={onClick}
                >
                    Install
                </Button>
            </div>
        </div>
    );
};

export default CustomInstallDesktop;
