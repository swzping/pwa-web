import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { useHistory, useLocation } from 'react-router-dom';
import { handleAction } from 'redux-actions';
import { useQuery } from '@apollo/client';
import { useAllowGuestCheckout } from '../../../../../../modules/peregrine/talons/AllowGuestCheckout/useAllowGuestCheckout';
import defaultClasses from './index.module.css';

const EventBookingEntry = ({ name, link, to }) => {
    const classes = useStyle(defaultClasses);
    const location = useLocation();
    const history = useHistory();
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const { showEventBookingEnabled } = useAllowGuestCheckout();

    const handleAction = () => {
        history.push('/offline-event-booking');
    };

    return (
        <>
            {showEventBookingEnabled ? (
                <div className={classes.eventBookingEntry}>
                    <div>
                        <div className={classes.eventName}>Event Booking</div>
                        <div className={classes.eventGoItBtn} onClick={handleAction}>
                            Go Check It
                        </div>
                    </div>
                    <img
                        className={classes.eventEntryIcon}
                        alt="event-entry-icon"
                        src="/venia-static-assets/images/offlineBooking/event_entry_icon.png"
                    />
                </div>
            ) : null}
        </>
    );
};

export default EventBookingEntry;
