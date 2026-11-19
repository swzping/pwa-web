// 搜索埋点
export const trackSearchClick = searchKey => {
    if (window?.QDTracker?.track) {
        window.QDTracker.track('search_click', {
            search_keyword: searchKey
        });
    }
};
