import React, { useState, useEffect, useContext } from 'react';
import { bool, shape, string } from 'prop-types';
import { useScrollLock } from '@magento/peregrine';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Footer from '@magento/venia-ui/lib/components/Footer';
import Header from '@magento/venia-ui/lib/components/Header';
import defaultClasses from '@magento/venia-ui/lib/components/Main/main.module.css';
import BottomNavigation from './components/bottom-navigation/bottom-navigation';
import { useWindowSize } from '@magento/peregrine';
import { useLocation } from 'react-router-dom';
import { HeaderContext } from '../../../peregrine/context/header';
import MobileHeader from '../../../../modules/swift-pwa-ui/components/Header/mobile/mobileHeader';
import ApotekerChat from '../../../../modules/swift-pwa-ui/components/ApotekerChat';
import InstallAppPopup from './components/custom-install-app/';

const Main = props => {
    const { children, isMasked, isMaintenance } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const { mobileNavConfig } = useContext(HeaderContext);

    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 768;
    const location = useLocation();

    const rootClass = isMasked ? classes.root_masked : classes.root;
    const pageClass = isMasked ? classes.page_masked : classes.page;

    useScrollLock(isMasked);

    if (isMaintenance === 1) {
        return (
            <main className={rootClass}>
                <div>
                    <picture>
                        <source media="(min-width:768px)" srcset="/venia-static-assets/images/maintenance-desktop.jpg"/>
                        <source media="(max-width:767px)" srcset="/venia-static-assets/images/maintenance-mobile.jpg"/>
                        <img src="/venia-static-assets/images/maintenance-desktop.jpg" alt="Maintenance Mode" style={{maxWidth: "100%"}}/>
                    </picture>
                </div>
            </main>
        );
    } else {
        return (
            <main className={rootClass}>
                <InstallAppPopup />
                {!location.pathname.includes('/healthcheck') && (
                    <>
                        {location.pathname === '/' || !isMobile ? (
                            <Header />
                        ) : (
                            <>
                                <MobileHeader
                                    showMobileNav={mobileNavConfig.showMobileNav}
                                    headerTitle={mobileNavConfig.headerTitle}
                                    redirectHome={mobileNavConfig.redirectHome}
                                    closeIcon={mobileNavConfig.closeIcon}
                                    allowCart={mobileNavConfig.useCart}
                                    borderBottom={mobileNavConfig.borderBottom}
                                />
                            </>
                        )}
                    </>
                )}
                <div className={`${pageClass} newPage`}>{children}</div>
                {!location.pathname.includes('/healthcheck') && (
                    <>
                        <Footer />
                        <div className="hidden-sm">
                            <BottomNavigation />
                        </div>
                        {process.env.APOTEKER_CHAT_ENABLE && <ApotekerChat link="https://api.whatsapp.com/send?phone=6281398782826&text=*Konsultasi%20Mengenai%20Obat%20dan%20kesehatan%20lainnya*%0APertanyaan%20saya:%20"/>}
                    </>
                )}
            </main>
        );
    }

};

export default Main;

Main.propTypes = {
    classes: shape({
        page: string,
        page_masked: string,
        root: string,
        root_masked: string
    }),
    isMasked: bool
};
