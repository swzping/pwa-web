/** H5 与桌面端分界，与项目 Main / Header 等保持一致 */
export const OSMOS_H5_MAX_WIDTH = 767;

export const isOsmosH5 = innerWidth => innerWidth <= OSMOS_H5_MAX_WIDTH;

/** 共享广告池：同页多 slot 顺序 consume，离开页面后重置以便返回时重新展示 */
export const createOsmosAdPool = () => ({
    sharedFetchPromise: null,
    sharedAdsList: [],
    nextConsumeIndex: 0,
    consumeChain: Promise.resolve(),
    activeConsumers: 0
});

export const acquireOsmosAdPoolConsumer = pool => {
    pool.activeConsumers = (pool.activeConsumers || 0) + 1;

    return () => {
        pool.activeConsumers = Math.max(0, (pool.activeConsumers || 1) - 1);
        if (pool.activeConsumers === 0) {
            pool.nextConsumeIndex = 0;
            pool.consumeChain = Promise.resolve();
        }
    };
};

const AD_UNIT_SUFFIX = {
    sliderBanner: 'HomePageSliderBanner',
    topPicks: 'HomePageTPBanner',
    brandBanner: 'HomePageBrandBanner'
};

/**
 * @param {boolean} isH5
 * @param {'sliderBanner' | 'topPicks' | 'brandBanner'} adUnitKey
 * @returns {{ pageType: string, adUnit: string[] } | null}
 */
export const getOsmosHomePageAdsConfig = (isH5, adUnitKey) => {
    const suffix = AD_UNIT_SUFFIX[adUnitKey];
    if (!suffix) {
        return null;
    }

    const prefix = isH5 ? 'GUIDMWeb' : 'GUIDDWeb';

    return {
        pageType: `${prefix}HomePage`,
        adUnit: [`${prefix}${suffix}`]
    };
};

/** 搜索页 Hot Keyword 广告位 */
export const getOsmosSearchHotKeywordConfig = isH5 => {
    const prefix = isH5 ? 'GUIDMWeb' : 'GUIDDWeb';

    return {
        pageType: `${prefix}Search`,
        adUnit: [`${prefix}HotKeyword`]
    };
};
