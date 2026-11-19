import React, { Children, useMemo, useEffect,useState} from 'react';
import { arrayOf, bool, number, oneOf, shape, string } from 'prop-types';
import SlickSlider from 'react-slick';
import Swiper from '@/modules/custom-modules/components/Swiper';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from '@magento/pagebuilder/lib/ContentTypes/Slider/slider.module.css';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { jarallax } from 'jarallax';
import {
    getOsmosHomePageAdsConfig,
    isOsmosH5,
    createOsmosAdPool,
    acquireOsmosAdPoolConsumer
} from '@/helpers/osmosAdsConfig';
import { buildOsmosAdItem } from '@/helpers/osmosNavigation';
import { useCliUbid } from '@/helpers/getUserIdentifier';

/**
 * Page Builder Slider component.
 *
 * This component is part of the Page Builder / PWA integration. It can be consumed without Page Builder.
 *
 * @typedef Slider
 * @kind functional component
 *
 * @param {props} props React component props
 *
 * @returns {React.Element} A React component that displays a Slider which contains slides.
 */
// 按 adUnit 分池：osmos-banner 与 osmos-topPicks 各自独立请求与顺序 consume
const createAdPool = createOsmosAdPool;
const adPools = new Map();
function getAdPool(poolKey) {
    if (!adPools.has(poolKey)) {
        adPools.set(poolKey, createAdPool());
    }
    return adPools.get(poolKey);
}
// 曝光事件去重
const registeredUclids = new Set();

const Slider = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth < 1024;
    const user_id = useCliUbid();
    const {
        minHeight,
        autoplay,
        autoplaySpeed,
        fade,
        infinite,
        showArrows,
        showDots,
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        cssClasses = [],
        children:originChildren,
        showSmallBanner,
        mode,
        behavior,
    } = props;

    const dynamicStyles = {
        minHeight: showSmallBanner ? 0 : minHeight,
        textAlign,
        border,
        borderColor,
        borderWidth,
        borderRadius,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
    };
    const [ads, setAds] = useState([]);
    const [error, setError] = useState('');
    const [adsLoaded, setAdsLoaded] = useState(false);
    const jarallaxInstances = {};

    // 1. 定义映射关系（class -> adUnitKey）
    const onlineAdsMap = {
        'osmos-banner': 'sliderBanner',
        'osmos-topPicks': 'topPicks',
        'osmos-brand-banner': 'brandBanner'
    };
    const matchedKey = useMemo(
        () => cssClasses.find(key => onlineAdsMap[key]),
        [cssClasses.join(',')] // 只要内容变才重新计算
    );
    const isH5 = isOsmosH5(windowSize.innerWidth);
    const osmosAdsConfig = useMemo(
        () =>
            matchedKey
                ? getOsmosHomePageAdsConfig(isH5, onlineAdsMap[matchedKey])
                : null,
        [matchedKey, isH5]
    );
    const needOnlineAds = osmosAdsConfig?.adUnit;
    const osmosPageType = osmosAdsConfig?.pageType;
    useEffect(() => {
        if (!needOnlineAds || !osmosPageType) {
            setAdsLoaded(true);
            return undefined;
        }

        let cancelled = false;

        setAds([]);
        setAdsLoaded(false);

        const poolKey = `${osmosPageType}|${needOnlineAds.join('|')}`;
        const releasePool = acquireOsmosAdPoolConsumer(getAdPool(poolKey));

        // 添加重试机制和依赖检查
        const waitForSDK = (maxAttempts = 100, delay = 500) => {
            return new Promise((resolve, reject) => {
                let attempts = 0;

                const checkSDK = () => {
                    attempts++;

                    // 检查 SDK 是否存在且已初始化
                    if (
                        window.onlineSalesSDK &&
                        typeof window.onlineSalesSDK.fetchDisplayAds === 'function' &&
                        typeof window.onlineSalesSDK.registerAdImpressionEvent === 'function'
                    ) {
                        resolve(window.onlineSalesSDK);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        reject(new Error('onlineSalesSDK not available after maximum attempts'));
                        return;
                    }

                    // 延迟重试
                    setTimeout(checkSDK, delay);
                };

                checkSDK();
            });
        };

        const fetchAds = async () => {
            const pool = getAdPool(poolKey);
            try {
                const sdk = await waitForSDK();
                if (cancelled) {
                    return;
                }

                const nullCount = (originChildren || []).filter(
                    c => c?.props?.data?.desktopImage == null
                ).length;
                const isOsmosBanner = cssClasses.includes('osmos-banner');
                const isOsmosTopPicks = cssClasses.includes('osmos-topPicks');
                const isOsmosBrandBanner = cssClasses.includes('osmos-brand-banner');
                const useSequentialConsume =
                    (isOsmosBanner || isOsmosTopPicks || isOsmosBrandBanner) &&
                    nullCount > 0;

                if (!pool.sharedFetchPromise) {
                    pool.sharedFetchPromise = sdk.fetchDisplayAds({
                        cliUbid: user_id,
                        'f.custom_label_1': 'GUID',
                        pageType: osmosPageType,
                        adUnit: needOnlineAds,
                        productCount: 10
                    });
                }
                const result = await pool.sharedFetchPromise;
                if (cancelled) {
                    return;
                }

                if (pool.sharedAdsList.length === 0) {
                    needOnlineAds.forEach(bannerName => {
                        const bannerArr = result?.ads?.[bannerName];
                        if (Array.isArray(bannerArr)) {
                            bannerArr
                                .slice()
                                .sort((a, b) => (a?.rank || 0) - (b?.rank || 0))
                                .forEach(item => {
                                if (item?.uclid && !registeredUclids.has(item.uclid)) {
                                    registeredUclids.add(item.uclid);
                                    sdk.registerAdImpressionEvent({
                                        cliUbid: user_id,
                                        'f.custom_label_1': 'GUID',
                                        uclid: item.uclid
                                    }).catch(() => {});
                                }
                                const image = item?.elements?.imageId;
                                if (image) {
                                    pool.sharedAdsList.push(buildOsmosAdItem(item));
                                }
                            });
                        }
                    });
                }

                let homeBannerList;
                if (useSequentialConsume) {
                    const consume = () => {
                        const start = pool.nextConsumeIndex;
                        const consumed = pool.sharedAdsList.slice(
                            start,
                            start + nullCount
                        );
                        pool.nextConsumeIndex += consumed.length;
                        return consumed;
                    };
                    pool.consumeChain = pool.consumeChain.then(consume);
                    homeBannerList = await pool.consumeChain;
                } else {
                    homeBannerList = pool.sharedAdsList;
                }

                if (cancelled) {
                    return;
                }

                setAds(homeBannerList?.length ? homeBannerList : []);
                setAdsLoaded(true);
                setError('');
            } catch (e) {
                if (cancelled) {
                    return;
                }
                pool.sharedFetchPromise = null;
                pool.sharedAdsList = [];
                pool.nextConsumeIndex = 0;
                pool.consumeChain = Promise.resolve();
                registeredUclids.clear();
                setError(e?.message || JSON.stringify(e));
                setAds([]);
                setAdsLoaded(true);
            }
        };

        fetchAds();

        return () => {
            cancelled = true;
            releasePool();
        };
    }, [matchedKey, user_id, isH5, osmosPageType]);

    const children = useMemo(() => {
        if (ads && ads.length > 0) {
            // 找出所有 desktopImage 为 null 的项的下标
            const nullIndexes = originChildren
                .map((child, idx) => (child?.props?.data?.desktopImage == null ? idx : -1))
                .filter(idx => idx !== -1);
            const adsToUse = ads;
            // 复制原始 children
            const replaced = originChildren.slice();
            // 替换 null 项
            nullIndexes.forEach((childIdx, i) => {
                if (adsToUse[i]) {
                    const {
                        image,
                        uclid,
                        clickType,
                        clickValue,
                        landingUrl
                    } = adsToUse[i];
                    const osmosAdData = {
                        desktopImage: image,
                        mobileImage: image,
                        link: '',
                        uclid,
                        clickType,
                        clickValue,
                        landingUrl,
                        isOsmosAd: true
                    };
                    const originalChild = originChildren[childIdx];
                    const nextData = {
                        ...originalChild.props.data,
                        ...osmosAdData
                    };
                    const newNode = {
                        ...originalChild,
                        props: {
                            ...originalChild.props,
                            ...osmosAdData,
                            data: nextData
                        }
                    };
                    replaced[childIdx] = newNode;
                } else {
                }
            });

            // 移除多余的 desktopImage 仍为 null 的项
            const filtered = replaced.filter(child => child?.props?.data?.desktopImage != null);
            return filtered;
        }
        // 没有 ads 或 ads 为空，移除所有 desktopImage 为 null 的项
        return originChildren.filter(child => child?.props?.data?.desktopImage != null);
    }, [originChildren, ads]);
    const dots = useMemo(() => {
        if (showSmallBanner) {
            if (cssClasses.includes('campaign-highlight')) {
                return false
            }
            // only one image
            if (isMobile && mode === 1 && behavior === 'options') {
                return true;
            }
            return false;
        }
        return isMobile;
    });

    const arrows = useMemo(() => {
        return !isMobile;
    });

    const sliderSettings = {
        mode: (showSmallBanner && mode) || 0,
        behavior,
        dots,
        arrows,
        autoplaySpeed,
        autoplay,
        infinite,
        isCampaignHighlight: !!cssClasses.includes('campaign-highlight')
    };

    const visibleChildren = Children.toArray(children)?.filter(child => {
        const cls = child?.props?.data?.cssClasses;
        return !cls?.includes('hide') && !cls?.includes('web-hide');
    });

    // Override classes on banner to ensure min height is respected
    const slideChildren = visibleChildren.map((child, index) => {
        if (child.props && child.props.data) {
            child.props.data.showSmallBanner = showSmallBanner;
            child.props.data.classes = {
                root: classes.bannerRoot,
                link: classes.bannerLink,
                wrapper: classes.bannerWrapper,
                posterOverlay: classes.bannerPosterOverlay
            };
            child.props.data.getParallax = (element, options) => {
                jarallaxInstances[index] = {
                    element,
                    options
                };
            };
            // add sliderIndex into children
            child.props.data.sliderIndex = index + 1;
        }
        return child;
    });
    if (!adsLoaded) return null; // 或者返回 <div>Loading...</div>
    return (
        <div
            aria-live="polite"
            aria-busy="false"
            className={[
                classes.root, 
                classes.sliderBanner,
                showSmallBanner ? classes.sliderSmallBanner : '',
                ...cssClasses
            ].join(' ')}
            style={dynamicStyles}
        >
            <Swiper {...sliderSettings}>{slideChildren}</Swiper>
        </div>
    );
};

/**
 * Props for {@link Slider}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the Slider
 * @property {String} classes.root CSS class for the slider root element
 * @property {String} classes.bannerRoot CSS class for the child banner item
 * @property {String} classes.bannerLink CSS class for the child banner item
 * @property {String} classes.bannerWrapper CSS class for the child banner item
 * @property {String} classes.bannerPosterOverlay CSS class for the child banner item
 * @property {String} minHeight CSS minimum height property
 * @property {String} autoplay Whether the slider should autoplay
 * @property {String} autoplaySpeed The speed at which the autoplay should move the slide on
 * @property {String} fade Fade between slides
 * @property {String} infinite Whether to infinitely scroll the slider
 * @property {String} showArrows Whether to show arrows on the slide for navigation
 * @property {String} showDots Whether to show navigation dots at the bottom of the slider
 * @property {String} textAlign Alignment of content within the slider
 * @property {String} border CSS border property
 * @property {String} borderColor CSS border color property
 * @property {String} borderWidth CSS border width property
 * @property {String} borderRadius CSS border radius property
 * @property {String} marginTop CSS margin top property
 * @property {String} marginRight CSS margin right property
 * @property {String} marginBottom CSS margin bottom property
 * @property {String} marginLeft CSS margin left property
 * @property {String} paddingTop CSS padding top property
 * @property {String} paddingRight CSS padding right property
 * @property {String} paddingBottom CSS padding bottom property
 * @property {String} paddingLeft CSS padding left property
 * @property {Array} cssClasses List of CSS classes to be applied to the component
 */
Slider.propTypes = {
    classes: shape({
        root: string,
        bannerRoot: string,
        bannerLink: string,
        bannerWrapper: string,
        bannerPosterOverlay: string
    }),
    appearance: oneOf(['default']),
    minHeight: string,
    autoplay: bool,
    autoplaySpeed: number,
    fade: bool,
    infinite: bool,
    showArrows: bool,
    showDots: bool,
    textAlign: string,
    border: string,
    borderColor: string,
    borderWidth: string,
    borderRadius: string,
    marginTop: string,
    marginRight: string,
    marginBottom: string,
    marginLeft: string,
    paddingTop: string,
    paddingRight: string,
    paddingBottom: string,
    paddingLeft: string,
    cssClasses: arrayOf(string)
};

export default Slider;
