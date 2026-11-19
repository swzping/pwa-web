export const isLightHouse = () => {
    if (navigator) {
        return navigator.userAgent.indexOf("Chrome-Lighthouse") > 0;
    }
    return false;
}