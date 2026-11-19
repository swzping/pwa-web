import React, { useEffect, useMemo, useState } from 'react';
import { arrayOf, shape, string } from 'prop-types';
import Swiper from '@/modules/custom-modules/components/Swiper';
import classNames from 'classnames';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useWindowSize } from '@magento/peregrine';
import defaultClasses from './smallIcon.module.css';
import { trackHomeCommonModuleClick } from '@/utils/track';
import {
    getOsmosHomePageAdsConfig,
    isOsmosH5,
    createOsmosAdPool,
    acquireOsmosAdPoolConsumer
} from '@/helpers/osmosAdsConfig';
import { useCliUbid } from '@/helpers/getUserIdentifier';
import { useHistory } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import {
    buildOsmosAdItem,
    handleOsmosAdClick,
    OSMOS_CLICK_TYPE,
    normalizeOsmosClickType,
    warmOsmosBrandListCache
} from '@/helpers/osmosNavigation';

const defaultBreakpoints = {
    0: {
        slidesPerView: 5,
        slidesPerGroup: 5,
        spaceBetween: 4,
    },
    768: {
        slidesPerView: 6,
        slidesPerGroup: 6,
        spaceBetween: 16,
    }
}

const brandsBreakpoints = {
    0: {
        slidesPerView: 4.33,
        spaceBetween: 4,
    },
    768: {
        slidesPerView: 7,
        slidesPerGroup: 7,
        spaceBetween: 8,
    }
}

const createAdPool = createOsmosAdPool;

const adPools = new Map();

function getAdPool(poolKey) {
    if (!adPools.has(poolKey)) {
        adPools.set(poolKey, createAdPool());
    }
    return adPools.get(poolKey);
}

const registeredUclids = new Set();

const SmallIcon = props => {
    const classes = useStyle(defaultClasses, props.classes);
    const windowSize = useWindowSize();
    const isMobile = windowSize.innerWidth <= 767;
    const { cssClasses = [], items = [] } = props;
    const user_id = useCliUbid();
    const history = useHistory();
    const apolloClient = useApolloClient();

    const isBrands = false;
    const [ads, setAds] = useState([]);
    const [adsLoaded, setAdsLoaded] = useState(false);

    const onlineAdsMap = {
        'osmos-smallIcon': 'brandBanner'
    };

    const matchedKey = useMemo(
        () => cssClasses.find(key => onlineAdsMap[key]),
        [cssClasses.join(',')]
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

        const waitForSDK = (maxAttempts = 100, delay = 500) =>
            new Promise((resolve, reject) => {
                let attempts = 0;

                const checkSDK = () => {
                    attempts++;

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

                    setTimeout(checkSDK, delay);
                };

                checkSDK();
            });

        const fetchAds = async () => {
            const pool = getAdPool(poolKey);

            try {
                const sdk = await waitForSDK();
                if (cancelled) {
                    return;
                }

                const nullCount = items.filter(item => item?.image == null).length;
                const useSequentialConsume =
                    cssClasses.includes('osmos-smallIcon') && nullCount > 0;

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
                        if (!Array.isArray(bannerArr)) {
                            return;
                        }

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

                            const image = item?.elements?.imageTc;
                            if (image) {
                                pool.sharedAdsList.push(
                                    buildOsmosAdItem(item, {
                                        ...item?.elements,
                                        imageTc: image,
                                        urlTc:
                                            item?.elements?.urlTc ||
                                            item?.elements?.clickValue
                                    })
                                );
                            }
                        });
                    });
                }

                const adsList = useSequentialConsume
                    ? await (pool.consumeChain = pool.consumeChain.then(() => {
                          const start = pool.nextConsumeIndex;
                          const consumed = pool.sharedAdsList.slice(start, start + nullCount);
                          pool.nextConsumeIndex += consumed.length;
                          return consumed;
                      }))
                    : pool.sharedAdsList;

                if (cancelled) {
                    return;
                }

                setAds(adsList?.length ? adsList : []);
                setAdsLoaded(true);
            } catch (error) {
                if (cancelled) {
                    return;
                }
                pool.sharedFetchPromise = null;
                pool.sharedAdsList = [];
                pool.nextConsumeIndex = 0;
                pool.consumeChain = Promise.resolve();
                registeredUclids.clear();
                setAds([]);
                setAdsLoaded(true);
            }
        };

        fetchAds();

        return () => {
            cancelled = true;
            releasePool();
        };
    }, [cssClasses, items, needOnlineAds, osmosPageType, user_id, isH5]);

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

    const extractedChildren = useMemo(() => {
        if (ads.length > 0) {
            const nullIndexes = items
                .map((item, idx) => (item?.image == null ? idx : -1))
                .filter(idx => idx !== -1);
            const replaced = items.slice();

            nullIndexes.forEach((itemIdx, index) => {
                if (!ads[index]) {
                    return;
                }

                const ad = ads[index];
                replaced[itemIdx] = {
                    ...items[itemIdx],
                    image: ad.image,
                    link: ad.link || '',
                    uclid: ad.uclid,
                    clickType: ad.clickType,
                    clickValue: ad.clickValue,
                    landingUrl: ad.landingUrl,
                    isOsmosAd: true
                };
            });

            return replaced.filter(item => item?.image != null);
        }

        return items.filter(item => item?.image != null);
    }, [ads, items]);

    const numberOfIcons = extractedChildren.length;

    // 如果是图标数量超过6个，则展示 Carousel
    const shouldShowCarousel = useMemo(() => {
        return numberOfIcons > 10;
    }, [numberOfIcons]);

    const handleCommonLinkClick = (item, key) => {
        trackHomeCommonModuleClick({
            contentType: 'smallIcon',
            title: item.caption,
            sortIndex: key + 1
        });
    };

    const handleItemClick = async (event, item, key) => {
        if (item && item.isOsmosAd) {
            event.preventDefault();
            event.stopPropagation();
        }

        handleCommonLinkClick(item, key);

        if (!item || !item.isOsmosAd) {
            return;
        }

        await handleOsmosAdClick({
            link: item.link,
            clickType: item.clickType,
            clickValue: item.clickValue,
            landingUrl: item.landingUrl,
            uclid: item.uclid,
            cliUbid: user_id,
            history,
            apolloClient
        });
    };

    const renderSmallIconLink = (child, key) => {
        const href =
            child.isOsmosAd && child.clickType !== OSMOS_CLICK_TYPE.URL
                ? '#'
                : child.link || child.clickValue || '#';

        return (
            <a
                href={href}
                className={classes.link}
                onClick={event => handleItemClick(event, child, key)}
            >
                <div className={classes.imageWrapper}>
                    <img width="80%" src={child.image} alt="Best Seller" />
                </div>
                <p className={classes.desc}>{child.caption}</p>
            </a>
        );
    };

    // 非Carousel场景的布局逻辑
    const renderNonCarouselLayout = () => {
        let gridClasses = '';

        if (isMobile) {
            if (numberOfIcons > 10) {
                gridClasses = classes.grid;
            } else {
                gridClasses = classNames(
                    classes.grid,
                    {
                    [classes.gridTwoRows]: numberOfIcons > 5,
                        [classes.gridFourColumns]: numberOfIcons === 8 || numberOfIcons === 7,
                    [classes.gridThreeColumns]: numberOfIcons === 6,
                    [classes.oneRow]: numberOfIcons <= 5
                    }
                );
            }
        } else {
            gridClasses = classNames(
                classes.grid,
                numberOfIcons <= 10 && classes.oneRow
            );
        }

        return (
            <div className={gridClasses}>
                {extractedChildren.map((child, key) => (
                    <div
                        key={key}
                        className={classes.item_wrapper}
                    >
                        <center>
                            {renderSmallIconLink(child, key)}
                        </center>
                    </div>
                ))}
            </div>
        );
    };

    const dots = useMemo(() => {
        if (isBrands) {
            return false;
        }
        return isMobile;
    }, [isBrands, isMobile]);


    const getRows = () => {
        // if (isBrands) {
        //     return 1
        // }
        if (isMobile) {
            return 2;
        }
        // if (numberOfIcons > 10 && numberOfIcons < 20) {
        //     return 1;
        // }
        return 1;
    };

    const defaultSettings = {
        dots,
        arrows: isMobile ? false : true,
        rows: getRows(),
        breakpoints: isBrands ? brandsBreakpoints : defaultBreakpoints
    };


    const smallIconSettings = { ...defaultSettings };

    if (!adsLoaded) {
        return null;
    }

    return (
        <div className={classNames(classes.root, ...cssClasses)}>
            {shouldShowCarousel ? (
                <Swiper {...smallIconSettings}>
                    {extractedChildren.map((child, key) => (
                        <div key={key} className={classes.item_wrapper}>
                            <center>
                                {renderSmallIconLink(child, key)}
                            </center>
                        </div>
                    ))}
                </Swiper>
            ) : (
                renderNonCarouselLayout()
            )}
        </div>
    );
};

SmallIcon.propTypes = {
    classes: shape({
        root: string,
        grid: string,
        gridTwoRows: string,
        centerRow: string,
    }),
    cssClasses: arrayOf(string)
};

export default SmallIcon;
