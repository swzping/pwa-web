import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'offlineEventBookingCategorySelection';
const BOOKING_ROUTE = '/offline-event-booking';
const FLOW_ROUTES = [
    '/offline-activity-detail',
    '/offline-activity-category',
    '/offline-activity-register'
];

const isFlowRoute = pathname => FLOW_ROUTES.includes(pathname);

const getRemainingSeconds = expiresAt =>
    Math.max(0, expiresAt - Math.floor(Date.now() / 1000));

const readCountdown = () => {
    try {
        const countdown = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        const expiresAt = Number(countdown?.expiresAt);

        return Number.isFinite(expiresAt)
            ? { eventId: String(countdown?.eventId || ''), expiresAt }
            : null;
    } catch (error) {
        return null;
    }
};

const saveCountdown = countdown => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(countdown));
    } catch (error) {
        // The countdown still works for the current page when storage is unavailable.
    }
};

const removeCountdown = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Storage is unavailable, so there is nothing to remove.
    }
};

const useOfflineBookingCountdown = ({
    enabled = false,
    eventId = '',
    durationSeconds = null
} = {}) => {
    const history = useHistory();
    const location = useLocation();
    const [expiresAt, setExpiresAt] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (!isFlowRoute(location.pathname)) {
            return;
        }

        const savedCountdown = readCountdown();
        const savedRemainingSeconds = savedCountdown
            ? getRemainingSeconds(savedCountdown.expiresAt)
            : 0;

        const canReuseSavedCountdown =
            savedRemainingSeconds > 0 &&
            (!enabled || !eventId || savedCountdown.eventId === String(eventId));

        if (canReuseSavedCountdown) {
            setExpiresAt(savedCountdown.expiresAt);
            setRemainingSeconds(savedRemainingSeconds);
            return;
        }

        removeCountdown();

        const duration = Number(durationSeconds);
        if (!enabled || !eventId || !Number.isFinite(duration) || duration <= 0) {
            setExpiresAt(null);
            setRemainingSeconds(0);
            return;
        }

        const nextExpiresAt = Math.floor(Date.now() / 1000) + duration;
        saveCountdown({
            eventId: String(eventId),
            expiresAt: nextExpiresAt
        });
        setExpiresAt(nextExpiresAt);
        setRemainingSeconds(duration);
    }, [enabled, eventId, durationSeconds, location.pathname]);

    useEffect(() => {
        if (!expiresAt) {
            return undefined;
        }

        const updateCountdown = () => {
            const remaining = getRemainingSeconds(expiresAt);
            setRemainingSeconds(remaining);

            if (remaining <= 0) {
                removeCountdown();
                setExpiresAt(null);
                history.push(BOOKING_ROUTE);
            }
        };

        updateCountdown();
        const intervalId = setInterval(updateCountdown, 1000);

        return () => clearInterval(intervalId);
    }, [expiresAt, history]);

    useEffect(() => {
        const clearCountdown = () => {
            removeCountdown();
            setExpiresAt(null);
            setRemainingSeconds(0);
        };
        const unlisten = history.listen(({ pathname }) => {
            if (!isFlowRoute(pathname)) {
                clearCountdown();
            }
        });

        return () => {
            unlisten();

            if (!isFlowRoute(history.location.pathname)) {
                clearCountdown();
            }
        };
    }, [history]);

    return {
        expiresAt,
        remainingSeconds
    };
};

export default useOfflineBookingCountdown;
