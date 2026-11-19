import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { clearCustomerDataFromCache } from '@magento/peregrine/lib/Apollo/clearCustomerDataFromCache';
import { clearCartDataFromCache } from '@magento/peregrine/lib/Apollo/clearCartDataFromCache';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';

/**
 * Hook to monitor route changes and clear cache when user leaves /account-information path
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the cache clearing is enabled (default: true)
 * @param {Array} options.clearTypes - Types of cache to clear (default: ['customer', 'cart'])
 * @returns {void}
 */
export const useAccountInformationCacheClear = (options = {}) => {
    const {
        enabled = true,
        clearTypes = ['customer', 'cart']
    } = options;

    const location = useLocation();
    const apolloClient = useApolloClient();
    const previousPathRef = useRef(null);
    const storage = new BrowserPersistence();

    useEffect(() => {
        if (!enabled) return;

        const currentPath = location.pathname;
        const previousPath = previousPathRef.current;

        // Check if user is leaving /account-information path
        const isLeavingAccountInformation = 
            previousPath && 
            previousPath.startsWith('/account-information') && 
            !currentPath.startsWith('/account-information');

        if (isLeavingAccountInformation) {
            console.log('User leaving /account-information path, clearing cache...');
            
            // Clear different types of cache based on configuration
            const clearCachePromises = [];

            if (clearTypes.includes('customer')) {
                clearCachePromises.push(clearCustomerDataFromCache(apolloClient));
            }

            if (clearTypes.includes('cart')) {
                clearCachePromises.push(clearCartDataFromCache(apolloClient));
            }

            if (clearTypes.includes('localStorage')) {
                // Clear specific localStorage items related to account information
                const keysToRemove = [
                    'account_information_cache',
                    'user_preferences',
                    'account_settings'
                ];
                
                keysToRemove.forEach(key => {
                    try {
                        storage.removeItem(key);
                    } catch (error) {
                        console.warn(`Failed to remove ${key} from storage:`, error);
                    }
                });
            }

            if (clearTypes.includes('sessionStorage')) {
                // Clear session storage items
                const sessionKeysToRemove = [
                    'account_session_data',
                    'temp_account_data'
                ];
                
                sessionKeysToRemove.forEach(key => {
                    try {
                        sessionStorage.removeItem(key);
                    } catch (error) {
                        console.warn(`Failed to remove ${key} from session storage:`, error);
                    }
                });
            }

            // Execute all cache clearing operations
            Promise.all(clearCachePromises)
                .then(() => {
                    console.log('Cache cleared successfully when leaving /account-information');
                })
                .catch(error => {
                    console.error('Error clearing cache when leaving /account-information:', error);
                });
        }

        // Update the previous path reference
        previousPathRef.current = currentPath;
    }, [location.pathname, apolloClient, enabled, clearTypes, storage]);

    // Return the current path for debugging purposes
    return {
        currentPath: location.pathname,
        previousPath: previousPathRef.current
    };
};
