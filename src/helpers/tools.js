/**
 * is mobile or pc
 */
export const getDeviceType = () => {
    if (typeof window === 'undefined') {
        // SSR fallback plan
        return 'pc';
    }

    const ua = navigator.userAgent || '';

    const isMobileUA = /Android|iPhone|iPod|Mobile/i.test(ua);
    const isSmallScreen = window.innerWidth < 768;
    const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;

    // iPad / Individual assessment of the tablet
    const isTablet =
        /iPad|Tablet/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024 && isTouchPrimary);

    // If any two items are hit, it is judged as mobile
    const score = (isMobileUA ? 1 : 0) + (isSmallScreen ? 1 : 0) + (isTouchPrimary ? 1 : 0) + (isTablet ? 1 : 0);

    return score >= 2 ? 'mobile' : 'pc';
};
