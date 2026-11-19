import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { attributesToProps, domToReact } from 'html-react-parser';
import { shape, string } from 'prop-types';
import Swiper from '@/modules/custom-modules/components/Swiper';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import { useCliUbid } from '@/helpers/getUserIdentifier';
import { useHistory } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import {
    buildOsmosAdItem,
    handleOsmosAdClick,
    normalizeOsmosClickType,
    OSMOS_CLICK_TYPE,
    warmOsmosBrandListCache
} from '@/helpers/osmosNavigation';
import { trackHomeCommonModuleClick, initCmsClickTracker } from '@/utils/track';
import {
    getOsmosHomePageAdsConfig,
    isOsmosH5,
    createOsmosAdPool,
    acquireOsmosAdPoolConsumer
} from '@/helpers/osmosAdsConfig';

import defaultClasses from './bannerPromo.module.css';

const createAdPool = createOsmosAdPool;

/** 超过该像素位移视为滑动，不触发广告跳转 */
const OSMOS_DRAG_THRESHOLD_PX = 10;

const adPools = new Map();
const registeredUclids = new Set();
let brandBannerViewport = null;

function getAdPool(poolKey) {
    if (!adPools.has(poolKey)) {
        adPools.set(poolKey, createAdPool());
    }
    return adPools.get(poolKey);
}

/** 视窗 PC/H5 切换时清空 brand banner 广告池，避免两端广告混用 */
function resetBrandBannerPoolsIfViewportChanged(isH5) {
    const viewport = isH5 ? 'h5' : 'dweb';
    if (brandBannerViewport !== null && brandBannerViewport !== viewport) {
        for (const key of adPools.keys()) {
            if (key.includes('HomePageBrandBanner')) {
                adPools.delete(key);
            }
        }
        registeredUclids.clear();
    }
    brandBannerViewport = viewport;
}

const findNodeByName = (node, name) => {
    if (!node) return null;
    if (node.type === 'tag' && node.name === name) return node;
    if (!node.children) return null;

    for (const child of node.children) {
        const found = findNodeByName(child, name);
        if (found) return found;
    }

    return null;
};

const cloneDomNode = node => {
    if (!node || typeof node !== 'object') return node;

    const cloned = { ...node };
    if (node.attribs) {
        cloned.attribs = { ...node.attribs };
    }
    if (node.children) {
        cloned.children = node.children.map(cloneDomNode);
    }

    return cloned;
};

const isEmptyImgSrc = imgNode => {
    const src = imgNode?.attribs?.src;
    return src == null || src === '';
};

const getBannerHighlightChildren = domNode =>
    (domNode.children || []).filter(
        child =>
            child.type === 'tag' &&
            child.attribs &&
            child.attribs.class === 'banner-highlight-children'
    );

const getOsmosSlotCount = domNode =>
    getBannerHighlightChildren(domNode).filter(item =>
        isEmptyImgSrc(findNodeByName(item, 'img'))
    ).length;

/** 写入 CMS 尺寸 CSS 变量，具体宽高由 CSS 媒体查询响应视窗变化 */
const applyCmsSlotDimensions = item => {
    const imgNode = findNodeByName(item, 'img');
    const linkNode = findNodeByName(item, 'a');
    if (!imgNode?.attribs) {
        return;
    }

    const w = parseInt(
        imgNode.attribs['data-cms-width'] || imgNode.attribs.width,
        10
    );
    const h = parseInt(
        imgNode.attribs['data-cms-height'] || imgNode.attribs.height,
        10
    );
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
        return;
    }

    imgNode.attribs['data-cms-width'] = String(w);
    imgNode.attribs['data-cms-height'] = String(h);
    delete imgNode.attribs.width;
    delete imgNode.attribs.height;

    imgNode.attribs.style =
        'width:100%;height:100%;margin:0;padding:0;object-fit:fill;display:block';

    if (linkNode?.attribs) {
        const className = linkNode.attribs.class || '';
        if (!className.includes('banner-highlight-slot')) {
            linkNode.attribs.class = className
                ? `${className} banner-highlight-slot`
                : 'banner-highlight-slot';
        }
        linkNode.attribs.style = `--banner-cms-w:${w}px;--banner-cms-h:${h}px;--banner-cms-ratio:${h / w}`;
    }
};

const BannerPromo = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const { domNode } = props;
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const isH5 = isOsmosH5(windowSize.innerWidth);
    const osmosAdsConfig = useMemo(
        () => getOsmosHomePageAdsConfig(isH5, 'brandBanner'),
        [isH5]
    );
    const user_id = useCliUbid();
    const history = useHistory();
    const apolloClient = useApolloClient();
    const [ads, setAds] = useState([]);
    const [adsLoaded, setAdsLoaded] = useState(false);

    const bannerItems = useMemo(() => {
        return getBannerHighlightChildren(domNode).map(child =>
            cloneDomNode(child)
        );
    }, [domNode, isH5]);

    const osmosSlotCount = useMemo(
        () => getOsmosSlotCount(domNode),
        [domNode]
    );

    const moduleClasses = useMemo(() => {
        const domClasses = (domNode?.attribs?.class || '').split(/\s+/).filter(Boolean);
        return [...(props.cssClasses || []), ...domClasses];
    }, [domNode, props.cssClasses]);

    const isViewportHidden = useMemo(() => {
        const isDesktopOnly = moduleClasses.includes('hidden-mobile');
        const isMobileOnly = moduleClasses.includes('hidden-desktop');
        return (isDesktopOnly && isMobile) || (isMobileOnly && !isMobile);
    }, [moduleClasses, isMobile]);

    useEffect(() => {
        let cancelled = false;

        if (isViewportHidden) {
            setAds([]);
            setAdsLoaded(true);
            return;
        }

        if (osmosSlotCount === 0) {
            setAds([]);
            setAdsLoaded(true);
            return;
        }

        if (!osmosAdsConfig) {
            setAds([]);
            setAdsLoaded(true);
            return;
        }

        resetBrandBannerPoolsIfViewportChanged(isH5);
        setAds([]);
        setAdsLoaded(false);

        const { pageType: osmosPageType, adUnit: needOnlineAds } = osmosAdsConfig;
        const poolKey = `${osmosPageType}|${needOnlineAds.join('|')}`;
        const releasePool = acquireOsmosAdPoolConsumer(getAdPool(poolKey));

        const waitForSDK = (maxAttempts = 100, delay = 500) =>
            new Promise((resolve, reject) => {
                let attempts = 0;

                const checkSDK = () => {
                    attempts++;

                    if (
                        window.onlineSalesSDK &&
                        typeof window.onlineSalesSDK.fetchDisplayAds ===
                            'function' &&
                        typeof window.onlineSalesSDK
                            .registerAdImpressionEvent === 'function'
                    ) {
                        resolve(window.onlineSalesSDK);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        reject(
                            new Error(
                                'onlineSalesSDK not available after maximum attempts'
                            )
                        );
                        return;
                    }

                    setTimeout(checkSDK, delay);
                };

                checkSDK();
            });

        const fetchAds = async () => {
            const pool = getAdPool(poolKey);

            try {
                const sdk = await waitForSDK();

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

                if (pool.sharedAdsList.length === 0) {
                    needOnlineAds.forEach(bannerName => {
                        const bannerArr = result?.ads?.[bannerName];
                        if (!Array.isArray(bannerArr)) {
                            return;
                        }

                        bannerArr
                            .slice()
                            .sort(
                                (a, b) =>
                                    (a?.rank || 0) - (b?.rank || 0)
                            )
                            .forEach(item => {
                            if (
                                item?.uclid &&
                                !registeredUclids.has(item.uclid)
                            ) {
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
                    });
                }

                const consume = () => {
                    const start = pool.nextConsumeIndex;
                    const consumed = pool.sharedAdsList.slice(
                        start,
                        start + osmosSlotCount
                    );
                    pool.nextConsumeIndex += consumed.length;
                    return consumed;
                };

                pool.consumeChain = pool.consumeChain.then(consume);
                const adsList = await pool.consumeChain;

                if (!cancelled) {
                    setAds(adsList?.length ? adsList : []);
                    setAdsLoaded(true);
                }
            } catch (error) {
                if (!cancelled) {
                    pool.sharedFetchPromise = null;
                    pool.sharedAdsList = [];
                    pool.nextConsumeIndex = 0;
                    pool.consumeChain = Promise.resolve();
                    registeredUclids.clear();
                    setAds([]);
                    setAdsLoaded(true);
                }
            }
        };

        fetchAds();

        return () => {
            cancelled = true;
            releasePool();
        };
    }, [osmosSlotCount, user_id, isH5, osmosAdsConfig, isViewportHidden]);

    useEffect(() => {
        if (!apolloClient || !ads.length) {
            return;
        }

        const hasBrandAd = ads.some(
            ad =>
                normalizeOsmosClickType(ad.clickType) === OSMOS_CLICK_TYPE.BRAND
        );

        if (hasBrandAd) {
            void warmOsmosBrandListCache(apolloClient);
        }
    }, [ads, apolloClient]);

    const processedChildren = useMemo(() => {
        const replaced = bannerItems.map(item => cloneDomNode(item));

        if (ads.length > 0) {
            const nullIndexes = replaced
                .map((item, idx) =>
                    isEmptyImgSrc(findNodeByName(item, 'img')) ? idx : -1
                )
                .filter(idx => idx !== -1);

            nullIndexes.forEach((itemIdx, index) => {
                if (!ads[index]) {
                    return;
                }

                const imgNode = findNodeByName(replaced[itemIdx], 'img');
                const linkNode = findNodeByName(replaced[itemIdx], 'a');
                const { image, uclid, clickType, clickValue, landingUrl } =
                    ads[index];

                if (imgNode) {
                    imgNode.attribs.src = image;
                }
                if (linkNode) {
                    if (clickType) {
                        linkNode.attribs['data-osmos-click-type'] = clickType;
                    }
                    if (clickValue) {
                        linkNode.attribs['data-osmos-click-value'] = clickValue;
                    }
                    if (landingUrl) {
                        linkNode.attribs['data-osmos-landing-url'] = landingUrl;
                    }
                    // 所有 Osmos 广告统一 href="#"，避免 URL 类型写入 google 等外链导致原生跳转
                    linkNode.attribs.href = '#';
                    if (uclid) {
                        linkNode.attribs['data-uclid'] = uclid;
                    }
                }
            });
        }

        const visible = replaced.filter(item => {
            const imgNode = findNodeByName(item, 'img');
            return imgNode && !isEmptyImgSrc(imgNode);
        });

        visible.forEach(item => {
            applyCmsSlotDimensions(item);
        });

        return visible;
    }, [ads, bannerItems]);

    const osmosAdsByUclid = useMemo(() => {
        const map = new Map();
        ads.forEach(ad => {
            if (ad?.uclid) {
                map.set(ad.uclid, ad);
            }
        });
        return map;
    }, [ads]);

    const osmosPointerStartRef = useRef(null);

    const handleOsmosPointerDown = useCallback(event => {
        const point = event.touches?.[0] || event;
        osmosPointerStartRef.current = {
            x: point.clientX,
            y: point.clientY
        };
    }, []);

    const isOsmosDragGesture = useCallback(event => {
        const start = osmosPointerStartRef.current;
        if (!start) {
            return false;
        }
        const point = event.changedTouches?.[0] || event;
        const dx = Math.abs(point.clientX - start.x);
        const dy = Math.abs(point.clientY - start.y);
        return dx > OSMOS_DRAG_THRESHOLD_PX || dy > OSMOS_DRAG_THRESHOLD_PX;
    }, []);

    const handleTrackClick = initCmsClickTracker({
        selector: '.banner-highlight-slot',
        resourceType: 'BannerPromo',
        trackFn: trackHomeCommonModuleClick,
        extraParams: {
            cssClasses: props.cssClasses || []
        }
    });

    const handleOsmosAdPress = useCallback(
        async (event, ad) => {
            if (isOsmosDragGesture(event)) {
                return;
            }

            const clickType = normalizeOsmosClickType(
                ad?.clickType ||
                    event.currentTarget.getAttribute('data-osmos-click-type')
            );
            const clickValue =
                ad?.clickValue ||
                event.currentTarget.getAttribute('data-osmos-click-value');

            if (!clickType || !clickValue) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            handleTrackClick(event);

            await handleOsmosAdClick({
                clickType,
                clickValue,
                landingUrl:
                    ad?.landingUrl ||
                    event.currentTarget.getAttribute('data-osmos-landing-url'),
                uclid:
                    ad?.uclid ||
                    event.currentTarget.getAttribute('data-uclid'),
                cliUbid: user_id,
                history,
                apolloClient
            });
        },
        [user_id, history, apolloClient, handleTrackClick, isOsmosDragGesture]
    );

    const childrenOptions = useMemo(
        () => ({
            replace: node => {
                if (!node?.attribs) {
                    return;
                }
                if (node.attribs.class === 'banner-highlight-children') {
                    return domToReact(node.children, childrenOptions);
                }
                const uclid = node.attribs['data-uclid'];
                const ad = uclid ? osmosAdsByUclid.get(uclid) : null;
                if (node.name === 'a' && ad) {
                    const props = attributesToProps(node.attribs);
                    return (
                        <a
                            {...props}
                            onPointerDown={handleOsmosPointerDown}
                            onTouchStart={handleOsmosPointerDown}
                            onClick={event => handleOsmosAdPress(event, ad)}
                        >
                            {domToReact(node.children, childrenOptions)}
                        </a>
                    );
                }
            }
        }),
        [osmosAdsByUclid, handleOsmosAdPress, handleOsmosPointerDown]
    );

    const swiperSettings = {
        autoplay: false,
        autoplaySpeed: 5000,
        arrows: !isMobile,
        dots: false,
        threshold: 8,
        slidesPerView: 'auto',
        breakpoints: {
            0: {
                slidesPerView: 'auto',
                spaceBetween: 8
            },
            768: {
                slidesPerView: 'auto',
                spaceBetween: 16
            }
        }
    };

    if (isViewportHidden) {
        return null;
    }

    if (!adsLoaded) {
        return null;
    }

    if (!processedChildren.length) {
        return null;
    }

    return (
        <div className={classes.root}>
            <Swiper key={isH5 ? 'h5' : 'dweb'} {...swiperSettings}>
                {domToReact(processedChildren, childrenOptions)}
            </Swiper>
        </div>
    );
};

export default BannerPromo;

BannerPromo.propTypes = {
    classes: shape({
        root: string
    })
};
