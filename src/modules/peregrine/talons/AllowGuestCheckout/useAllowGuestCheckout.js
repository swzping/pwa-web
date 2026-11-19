import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import DEFAULT_OPERATIONS from './allowGuestCheckout.gql';

export const useAllowGuestCheckout = () => {
    const { data: getAllowGuestCheckoutData, loading: getAllowGuestCheckoutLoading } = useQuery(DEFAULT_OPERATIONS.getAllowGuestCheckout, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const isLoadingAllowGuestCheckout = useMemo(() => {
        if (getAllowGuestCheckoutLoading) {
            return true;
        }
        return false;
    }, [getAllowGuestCheckoutLoading]);

    const isAllowGuestCheckout = useMemo(() => {
        if (getAllowGuestCheckoutData) {
            return getAllowGuestCheckoutData.storeConfig.allow_guest_checkout;
        }
    }, [getAllowGuestCheckoutData]);

    // temporarily testing whitelist production
    const isAllowCustomerGroup = useMemo(() => {
        if (getAllowGuestCheckoutData) {
            return getAllowGuestCheckoutData.storeConfig.temporary_customer_group_allow_checkout;
        }
    }, [getAllowGuestCheckoutData]);

    const showEventBookingEnabled = useMemo(() => {
        if (getAllowGuestCheckoutData) {
            return getAllowGuestCheckoutData.storeConfig.dfi_event_booking_enabled;
        }
    }, [getAllowGuestCheckoutData]);

    const eventBookingCategorySelectionTimeout = useMemo(() => {
        const timeout = Number(getAllowGuestCheckoutData?.storeConfig?.dfi_event_booking_category_selection_timeout);
        return Number.isFinite(timeout) && timeout > 0 ? timeout : null;
    }, [getAllowGuestCheckoutData]);

    return {
        isLoadingAllowGuestCheckout: Boolean(isLoadingAllowGuestCheckout),
        showEventBookingEnabled: Boolean(showEventBookingEnabled),
        eventBookingCountdown: eventBookingCategorySelectionTimeout,
        isAllowGuestCheckout: Boolean(isAllowGuestCheckout),
        isAllowCustomerGroup: Boolean(isAllowCustomerGroup)
    };
};
