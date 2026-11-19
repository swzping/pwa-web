import { renderHook } from '@testing-library/react-hooks';
import { useLocation } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { useAccountInformationCacheClear } from '../useAccountInformationCacheClear';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useLocation: jest.fn()
}));

jest.mock('@apollo/client', () => ({
    useApolloClient: jest.fn()
}));

jest.mock('@magento/peregrine/lib/Apollo/clearCustomerDataFromCache', () => ({
    clearCustomerDataFromCache: jest.fn()
}));

jest.mock('@magento/peregrine/lib/Apollo/clearCartDataFromCache', () => ({
    clearCartDataFromCache: jest.fn()
}));

describe('useAccountInformationCacheClear', () => {
    const mockApolloClient = {};
    const mockClearCustomerDataFromCache = require('@magento/peregrine/lib/Apollo/clearCustomerDataFromCache').clearCustomerDataFromCache;
    const mockClearCartDataFromCache = require('@magento/peregrine/lib/Apollo/clearCartDataFromCache').clearCartDataFromCache;

    beforeEach(() => {
        useApolloClient.mockReturnValue(mockApolloClient);
        mockClearCustomerDataFromCache.mockResolvedValue();
        mockClearCartDataFromCache.mockResolvedValue();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should not clear cache when staying on account-information path', () => {
        useLocation.mockReturnValue({ pathname: '/account-information' });
        
        renderHook(() => useAccountInformationCacheClear());
        
        // Change to another account-information sub-path
        useLocation.mockReturnValue({ pathname: '/account-information/order/123' });
        
        renderHook(() => useAccountInformationCacheClear());
        
        expect(mockClearCustomerDataFromCache).not.toHaveBeenCalled();
        expect(mockClearCartDataFromCache).not.toHaveBeenCalled();
    });

    it('should clear cache when leaving account-information path', async () => {
        // Start on account-information path
        useLocation.mockReturnValue({ pathname: '/account-information' });
        const { rerender } = renderHook(() => useAccountInformationCacheClear());
        
        // Leave account-information path
        useLocation.mockReturnValue({ pathname: '/home' });
        rerender();
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockClearCustomerDataFromCache).toHaveBeenCalledWith(mockApolloClient);
        expect(mockClearCartDataFromCache).toHaveBeenCalledWith(mockApolloClient);
    });

    it('should not clear cache when disabled', async () => {
        useLocation.mockReturnValue({ pathname: '/account-information' });
        const { rerender } = renderHook(() => useAccountInformationCacheClear({ enabled: false }));
        
        useLocation.mockReturnValue({ pathname: '/home' });
        rerender();
        
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockClearCustomerDataFromCache).not.toHaveBeenCalled();
        expect(mockClearCartDataFromCache).not.toHaveBeenCalled();
    });

    it('should only clear specified cache types', async () => {
        useLocation.mockReturnValue({ pathname: '/account-information' });
        const { rerender } = renderHook(() => 
            useAccountInformationCacheClear({ 
                clearTypes: ['customer'] 
            })
        );
        
        useLocation.mockReturnValue({ pathname: '/home' });
        rerender();
        
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockClearCustomerDataFromCache).toHaveBeenCalledWith(mockApolloClient);
        expect(mockClearCartDataFromCache).not.toHaveBeenCalled();
    });
});
