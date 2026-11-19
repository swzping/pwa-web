import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import compClasses from './index.module.css';

const OfflineBgImage = props => {
    const { showTop = true, showBottom = true } = props;
    const classes = useStyle(compClasses);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;

    return (
        <>
            {isMobile ? (
                <>
                    {/* 顶部背景 */}
                    {showTop && (
                        <img
                            className={classes.backgroundTop}
                            src="/venia-static-assets/images/offlineBooking/event_booking_bg_top.svg"
                        />
                    )}
                    {/* 底部背景 */}
                    {showBottom && (
                        <img
                            className={classes.backgroundBottom}
                            src="/venia-static-assets/images/offlineBooking/event_booking_bg_bottom.svg"
                        />
                    )}
                </>
            ) : (
                <>
                    {/* 顶部背景 */}
                    {showTop && (
                        <img
                            className={classes.backgroundTopPc}
                            src="/venia-static-assets/images/offlineBooking/event_booking_bg_top_pc.svg"
                        />
                    )}
                    {/* 底部背景 */}
                    {showBottom && (
                        <img
                            className={classes.backgroundBottomPc}
                            src="/venia-static-assets/images/offlineBooking/event_booking_bg_bottom_pc.svg"
                        />
                    )}
                </>
            )}
        </>
    );
};

export default OfflineBgImage;
