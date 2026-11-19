import { useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client';

import { useAppContext } from '@magento/peregrine/lib/context/app';
import { useDropdown } from '@magento/peregrine/lib/hooks/useDropdown';

import DEFAULT_OPERATIONS from '../../../../modules/peregrine/talons/Header/header.gql';

export const useHeader = () => {
    const [{ hasBeenOffline, isOnline, isPageLoading }] = useAppContext();
    const {
        elementRef: searchRef,
        expanded: isSearchOpen,
        setExpanded: setIsSearchOpen,
        triggerRef: searchTriggerRef
    } = useDropdown();

    const { data: storeConfigData } = useQuery(DEFAULT_OPERATIONS.getStoreConfigData, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const currentUrlLogo = useMemo(() => {
        if (
            storeConfigData 
            && storeConfigData.storeConfig 
            && storeConfigData.storeConfig.header_logo_src
        ) {
            return process.env.MAGENTO_BACKEND_URL + 'media/logo/' + storeConfigData.storeConfig.header_logo_src;
        }
    }, [storeConfigData]);

    const handleSearchTriggerClick = useCallback(() => {
        // Toggle the Search input form.
        setIsSearchOpen(isOpen => !isOpen);
    }, [setIsSearchOpen]);

    return {
        currentUrlLogo,
        handleSearchTriggerClick,
        hasBeenOffline,
        isOnline,
        isPageLoading,
        isSearchOpen,
        searchRef,
        searchTriggerRef
    };
};
