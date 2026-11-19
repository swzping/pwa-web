import React from 'react';
import Cookies from 'js-cookie';
import styles from './style.module.css';

const InstallAppPopup = () => {
    const closeInstallAppPopup = () => {
        const el = document.getElementById('installAppWrapper');
        // hidden popup
        if (el) {
            el.remove();
        }

        Cookies.set('installAppPopupHide', true);
    };

    let deviceOS = '';
    let isMobile = '';
    window.innerWidth <= 767 ? isMobile = true : isMobile = false;
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) {
        deviceOS = 'Android';
    } else if ((/iPad|iPhone|iPod/.test(userAgent)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)){
        deviceOS = 'iOS';
    }

    const installAppPopupHide = Cookies.get('installAppPopupHide');
    const deepLinkUrl = `https://guardianid.page.link/download-prompt?link=${encodeURIComponent(window.location.href)}`

    if ((!installAppPopupHide || installAppPopupHide === 'undefined') && isMobile) {
        return (
            <div className={styles.installAppWrapper} id="installAppWrapper">
                {deviceOS === "Android" ?
                    <a
                        className={styles.mainContent}
                        href={deepLinkUrl}
                    >
                        <div className={styles.title}>DOWNLOAD MOBILE APP</div>
                        <div className={styles.imagesWrapper}>
                            <img
                                className={styles.guardianLogo}
                                alt="GuardianID"
                                src="/venia-static-assets/images/logo_mobile.png"
                            />
                            <img
                                className={styles.playStoreLogo}
                                alt="Play Store"
                                src="/venia-static-assets/images/playstore.png"
                            />
                        </div>
                    </a>
                    : <a
                        className={styles.mainContent}
                        href={deepLinkUrl}
                    >
                        <div className={styles.title}>DOWNLOAD MOBILE APP</div>
                        <div className={styles.imagesWrapper}>
                            <img
                                className={styles.guardianLogo}
                                alt="GuardianID"
                                src="/venia-static-assets/images/logo_mobile.png"
                            />
                            <img
                                className={styles.appStoreLogo}
                                alt="App Store"
                                src="/venia-static-assets/images/appstore.png"
                            />
                        </div>
                    </a>
                }
                <div className={styles.closePopup} onClick={closeInstallAppPopup}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16" height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                    >
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1
                            .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146
                            5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
                        />
                    </svg>
                </div>
            </div>
        );
    } else {
        return <div></div>;
    }

}

export default InstallAppPopup;
