import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useMagentoRoute as useBaseMagentoRoute } from '@magento/peregrine/lib/talons/MagentoRoute/useMagentoRoute';

/**
 * How long (ms) the NOT_FOUND view stays visible before
 * the user is sent back to the homepage.
 */
const REDIRECT_DELAY_MS = 2000;

/**
 * Wraps the stock useMagentoRoute talon: when a URL cannot be
 * resolved (404), wait REDIRECT_DELAY_MS then navigate to the
 * homepage. The stock ErrorView still renders during the delay.
 */
export const useMagentoRoute = (props = {}) => {
    const routeData = useBaseMagentoRoute(props);
    const { replace } = useHistory();
    const { isNotFound } = routeData || {};

    useEffect(() => {
        if (!isNotFound) {
            return;
        }

        const timer = setTimeout(() => {
            replace('/');
        }, REDIRECT_DELAY_MS);

        // Cancel the redirect if the user navigates elsewhere first
        return () => clearTimeout(timer);
    }, [isNotFound, replace]);

    return routeData;
};
