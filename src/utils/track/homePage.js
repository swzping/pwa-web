// 设置通用会员ID参数
export const trackCommonDataMemberId = (memberId = '') => {
    if (window?.QDTracker?.setAccountInfo) {
        let finalId = memberId.trim();
        if (['null', 'undefined'].includes(finalId)) finalId = '';
        window.QDTracker.setAccountInfo({ guid_member_id: finalId });
    }
};
// 顶部导航栏公共点击
export const trackNavigationCommonClick = (
    firstItem = {},
    secondItem = {},
    thirdItem = {},
    type = ''
) => {
    if (window?.QDTracker?.track) {
        if (type === 'firstLevel') {
            window.QDTracker.track('navigation_first_module_click', firstItem);
        }
        if (type === 'secondLevel') {
            const secondParams = {
                ...firstItem,
                second_level_module: secondItem.name,
                second_level_module_rank: secondItem.sort_by
            };
            window.QDTracker.track(
                'navigation_second_module_click',
                secondParams
            );
        }
        if (type === 'thirdLevel') {
            const thirdParams = {
                ...firstItem,
                second_level_module: secondItem.name,
                second_level_module_rank: secondItem.sort_by,
                third_level_module: thirdItem.name,
                third_level_module_rank: thirdItem.sort_by
            };
            window.QDTracker.track(
                'navigation_third_module_click',
                thirdParams
            );
        }
    }
};

// 首页共用模块点击
export const trackHomeCommonModuleClick = params => {
    if (window?.QDTracker?.track) {
        const {
            title = '',
            contentType = '',
            cssClasses = [],
            sortIndex = 1,
            isTrack = false
        } = params;
        const pathname = window.location.pathname;
        const isHomePage = pathname === '/' || pathname === '/home';
        if (isHomePage || isTrack) {
            const newParams = {
                location_name: title || '',
                module_rank: sortIndex,
                module_content: cssClasses?.join() || '',
                resource_type: contentType
            };
            window.QDTracker.track('homepage_module_click', newParams);
        }
    }
};

// 首页中间banner点击
export const trackHomepageMiddleBannerClick = (name, rank) => {
    if (window?.QDTracker?.track) {
        window.QDTracker.track('homepage_middle_banner_click', {
            banner_name: name,
            banner_rank: rank
        });
    }
};

// 初始化CMS事件
export const initCmsClickTracker = ({
    selector = 'a',
    resourceType,
    trackFn,
    extraParams
}) => {
    return function handleClick(e) {
        const el = e.target.closest(selector);

        if (!el || !e.currentTarget.contains(el)) return;

        const elements = [...e.currentTarget.querySelectorAll(selector)];
        const sortBy = elements.indexOf(el) + 1;

        if (sortBy <= 0) return;

        const baseParams = {
            sortIndex: sortBy,
            contentType: resourceType
        };

        trackFn({
            ...baseParams,
            ...extraParams
        });
    };
};

// 弹窗点击
export const trackHomepagePopUpClick = params => {
    if (window?.QDTracker?.track) {
        const { jumpUrl = '', isClosed } = params;
        const pathname = window.location.pathname;
        const isHomePage = pathname === '/' || pathname === '/home';
        if (isHomePage) {
            window.QDTracker.track('$app_pop_up_click', {
                jump_url: jumpUrl,
                is_closed: isClosed
            });
        }
    }
};

// H5底部导航栏点击
export const trackNavigationButtonClick = params => {
    if (window?.QDTracker?.track) {
        const { name = '' } = params;
        window.QDTracker.track('bottom_menu_click', {
            menu_name: name,
        });
    }
};
