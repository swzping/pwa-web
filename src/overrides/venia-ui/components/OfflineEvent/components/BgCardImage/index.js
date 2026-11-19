import React from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import compClasses from './index.module.css';

const OfflineBgCardImage = props => {
    const { showGuardian = true } = props;
    const classes = useStyle(compClasses);

    return (
        <>
            <div className={classes.eventBgBottomBox}>
                <img
                    className={classes.eventBgBottomIcon}
                    alt="guardian-run"
                    src="/venia-static-assets/images/offlineBooking/event_bottom_icon1.png"
                />
                <img
                    className={`${classes.eventBgBottomIcon} ${classes.eventBgOneIcon}`}
                    alt="guardian-run"
                    src="/venia-static-assets/images/offlineBooking/event_bottom_icon2.png"
                />
                {showGuardian ? (
                    <img
                        className={classes.eventGuardianIcon}
                        alt="guardian-run"
                        src="/venia-static-assets/images/offlineBooking/event_guardian.svg"
                    />
                ) : null}
            </div>
        </>
    );
};

export default OfflineBgCardImage;
