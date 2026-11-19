import React, { useEffect, useMemo, useState } from 'react';
import defaultClasses from './recentSearch.module.css';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useQuery, useMutation, gql, useApolloClient } from '@apollo/client';
import { useHistory } from 'react-router-dom';
import { useWindowSize } from '@magento/peregrine';
import RichContent from '@magento/venia-ui/lib/components/RichContent';
import { trackSearchClick } from '@/utils/track';
import { useCliUbid } from '@/helpers/getUserIdentifier';
import {
    getOsmosSearchHotKeywordConfig,
    isOsmosH5
} from '@/helpers/osmosAdsConfig';
import {
    buildOsmosAdItem,
    handleOsmosAdClick,
    normalizeOsmosClickType,
    OSMOS_CLICK_TYPE
} from '@/helpers/osmosNavigation';

const newRecentSearch = ( { setVisible } ) => {
    const classes = useStyle(defaultClasses);
    const history = useHistory();
    const { push } = history;
    const [recentShowMore, setRecentShowMore] = useState(true)
    const [hotShowMore, setHotShowMore] = useState(true)
    const [hotKeywordAds, setHotKeywordAds] = useState([]);
    const cliUbid = useCliUbid();
    const apolloClient = useApolloClient();
    const windowSize = useWindowSize();
    const isH5 = isOsmosH5(windowSize.innerWidth);
    const osmosSearchConfig = useMemo(
        () => getOsmosSearchHotKeywordConfig(isH5),
        [isH5]
    );

    const { data, refetch } = useQuery(SEARCH_BLOCK_ENHANCEMENT_MULTIPLE, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const [ clearRecentSearches ] = useMutation(CLEAR_RECENT_SEARCHES);

    const { data: cmsData } = useQuery(CMS_BLOCKS, {
        variables: { identifiers: ["product_trending_search_enhancements"] },
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    const content = useMemo(() => {
      return cmsData?.cmsBlocks?.items[0]?.content
    }, [cmsData]);

    // const { loading, error, data } = useQuery(GET_PRODUCTS_BY_URL_KEY, {
    //     variables: { pageSize: 12 },
    //     fetchPolicy: 'cache-and-network',
    //     nextFetchPolicy: 'cache-and-network',
    // });
    // const items = data?.products?.items?.slice(0, 10) || [];
    let recentSearches = data?.searchBlockEnhancement?.recent_searches || []
    const hotKeywords = data?.searchBlockEnhancement?.hotKeywords || []
    const topBrands = data?.searchBlockEnhancement?.topBrands || []

    useEffect(() => {
        let cancelled = false;

        const waitForSDK = (maxAttempts = 40, delay = 250) =>
            new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    attempts++;
                    const sdk = window?.onlineSalesSDK;
                    if (
                        sdk &&
                        typeof sdk.fetchDisplayAds === 'function' &&
                        typeof sdk.registerAdImpressionEvent === 'function'
                    ) {
                        resolve(sdk);
                        return;
                    }
                    if (attempts >= maxAttempts) {
                        reject(new Error('onlineSalesSDK not available'));
                        return;
                    }
                    setTimeout(check, delay);
                };
                check();
            });

        const mapKeywordAd = item => {
            const elements = item?.elements || {};
            const query_text = (elements.keyword || '').toString().trim();
            if (!query_text) {
                return null;
            }

            const ad = buildOsmosAdItem(item, {
                ...elements,
                urlTc: elements.urlTc || elements.url
            });

            return {
                query_text,
                clickType: ad.clickType,
                clickValue: ad.clickValue,
                landingUrl: ad.landingUrl,
                link: ad.link,
                uclid: ad.uclid,
                rank: ad.rank
            };
        };

        const fetchHotKeywordAds = async () => {
            try {
                const sdk = await waitForSDK();
                if (cancelled) {
                    return;
                }

                const { pageType, adUnit } = osmosSearchConfig;
                const adUnitKey = adUnit[0];

                const result = await sdk.fetchDisplayAds({
                    cliUbid,
                    adUnit,
                    'f.custom_label_1': 'GUID',
                    pageType,
                    productCount: 10
                });
                if (cancelled) {
                    return;
                }

                const raw =
                    result?.ads?.[adUnitKey] ||
                    (result?.ads &&
                        typeof result.ads === 'object' &&
                        Object.values(result.ads).find(v => Array.isArray(v)));
                const list = Array.isArray(raw) ? raw : [];

                const seenUclids = new Set();
                const mapped = list
                    .slice()
                    .sort((a, b) => (a?.rank || 0) - (b?.rank || 0))
                    .map(mapKeywordAd)
                    .filter(Boolean)
                    .filter(x => {
                        if (!x.uclid) {
                            return true;
                        }
                        if (seenUclids.has(x.uclid)) {
                            return false;
                        }
                        seenUclids.add(x.uclid);
                        return true;
                    });

                // 曝光上报：同一个 uclid 仅一次
                mapped.forEach(x => {
                    if (x.uclid) {
                        sdk.registerAdImpressionEvent({
                            cliUbid,
                            'f.custom_label_1': 'GUID',
                            uclid: x.uclid
                        }).catch(() => {});
                    }
                });

                if (!cancelled) setHotKeywordAds(mapped);
            } catch (e) {
                if (!cancelled) setHotKeywordAds([]);
            }
        };

        fetchHotKeywordAds();

        return () => {
            cancelled = true;
        };
    }, [cliUbid, isH5, osmosSearchConfig]);

    const combinedHotKeywords = useMemo(() => {
        if (!hotKeywordAds?.length) {
            return (hotKeywords || []).map(x => ({ ...x, isFromAd: false }));
        }
        const seen = new Set();
        const normalize = s => (s || '').toString().trim().toLowerCase();
        const fromAds = hotKeywordAds
            .filter(x => {
                const key = normalize(x.query_text);
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map(x => ({ ...x, isFromAd: true }));
        const fromCms = (hotKeywords || [])
            .filter(x => {
                const key = normalize(x?.query_text);
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map(x => ({ ...x, isFromAd: false }));
        return [...fromAds, ...fromCms];
    }, [hotKeywordAds, hotKeywords]);

    const handleSearch = (search_query) => {
        push(`/search.html?query=${search_query}`);
        setVisible(false)
        trackSearchClick(search_query || '')
    }

    const handleHotKeywordClick = async item => {
        if (item?.isFromAd) {
            const clickValue = (item?.clickValue || '').toString().trim();
            const clickType = normalizeOsmosClickType(item?.clickType);
            const link = (item?.link || item?.landingUrl || '').toString().trim();
            const hasAdTarget =
                (clickType &&
                    clickType !== OSMOS_CLICK_TYPE.URL &&
                    !!clickValue) ||
                !!(clickValue || link);

            if (hasAdTarget) {
                setVisible(false);
                await handleOsmosAdClick({
                    link: item?.link,
                    clickType,
                    clickValue,
                    landingUrl: item?.landingUrl,
                    uclid: item?.uclid,
                    cliUbid,
                    history,
                    apolloClient
                });
                return;
            }

            handleSearch(item?.query_text);
            return;
        }

        if (item?.redirect_url) {
            setVisible(false);
            window.location.href = item.redirect_url;
            return;
        }

        handleSearch(item?.query_text);
    }

    return (
        <div className={classes.wrap}>
            {
              !!recentSearches.length && <div style={{ display: 'flex', alignItems: 'center',justifyContent: 'space-between'}}>
              <span className={classes.title}>Recent search</span>
                {
                  <svg onClick={() => {
                    clearRecentSearches({}).then(() => {
                      refetch()
                    })
                  }} style={{ cursor: 'pointer' }} width="43" height="11" viewBox="0 0 43 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.51424 9.88H6.18824L3.73124 5.85L1.23524 9.88H0.00024219L3.08124 5.044L0.195242 0.598004H1.49524L3.77024 4.238L6.05824 0.598004H7.29324L4.42024 5.018L7.51424 9.88ZM16.1814 1.495C15.6874 1.495 15.241 1.58167 14.8424 1.755C14.4437 1.91967 14.1057 2.16667 13.8284 2.496C13.551 2.81667 13.3387 3.211 13.1914 3.679C13.044 4.13834 12.9704 4.65834 12.9704 5.239C12.9704 6.00167 13.0874 6.66467 13.3214 7.228C13.564 7.79134 13.9194 8.22467 14.3874 8.528C14.864 8.83134 15.4577 8.983 16.1684 8.983C16.5757 8.983 16.9614 8.94834 17.3254 8.879C17.6894 8.80967 18.0447 8.723 18.3914 8.619V9.633C18.0447 9.763 17.685 9.85834 17.3124 9.919C16.9484 9.97967 16.5107 10.01 15.9994 10.01C15.0547 10.01 14.266 9.815 13.6334 9.425C13.0007 9.035 12.524 8.48034 12.2034 7.761C11.8914 7.04167 11.7354 6.19667 11.7354 5.226C11.7354 4.524 11.8307 3.88267 12.0214 3.302C12.2207 2.72134 12.5067 2.21867 12.8794 1.794C13.2607 1.36934 13.7287 1.04434 14.2834 0.819005C14.838 0.585004 15.475 0.468004 16.1944 0.468004C16.671 0.468004 17.1304 0.515671 17.5724 0.611004C18.0144 0.706338 18.4087 0.840671 18.7554 1.014L18.2874 2.002C18.0014 1.872 17.6807 1.755 17.3254 1.651C16.9787 1.547 16.5974 1.495 16.1814 1.495ZM21.4053 9.88H20.2613V4.23193e-06H21.4053V9.88ZM26.3038 2.782C26.9018 2.782 27.4131 2.912 27.8378 3.172C28.2711 3.432 28.6005 3.80034 28.8258 4.277C29.0598 4.745 29.1768 5.29534 29.1768 5.928V6.617H24.4058C24.4231 7.40567 24.6225 8.008 25.0038 8.424C25.3938 8.83134 25.9355 9.035 26.6288 9.035C27.0708 9.035 27.4608 8.996 27.7988 8.918C28.1455 8.83134 28.5008 8.71 28.8648 8.554V9.555C28.5095 9.711 28.1585 9.82367 27.8118 9.893C27.4651 9.971 27.0535 10.01 26.5768 10.01C25.9181 10.01 25.3331 9.87567 24.8218 9.607C24.3191 9.33834 23.9248 8.93967 23.6388 8.411C23.3615 7.87367 23.2228 7.21934 23.2228 6.448C23.2228 5.68534 23.3485 5.031 23.5998 4.485C23.8598 3.939 24.2195 3.51867 24.6788 3.224C25.1468 2.92934 25.6885 2.782 26.3038 2.782ZM26.2908 3.718C25.7448 3.718 25.3115 3.89567 24.9908 4.251C24.6788 4.59767 24.4925 5.083 24.4318 5.707H27.9808C27.9808 5.30834 27.9201 4.96167 27.7988 4.667C27.6775 4.37234 27.4911 4.14267 27.2398 3.978C26.9971 3.80467 26.6808 3.718 26.2908 3.718ZM33.5897 2.795C34.439 2.795 35.0674 2.98134 35.4747 3.354C35.882 3.72667 36.0857 4.32034 36.0857 5.135V9.88H35.2537L35.0327 8.892H34.9807C34.7814 9.14334 34.5734 9.35567 34.3567 9.529C34.1487 9.69367 33.906 9.815 33.6287 9.893C33.36 9.971 33.0307 10.01 32.6407 10.01C32.2247 10.01 31.8477 9.93634 31.5097 9.789C31.1804 9.64167 30.9204 9.41634 30.7297 9.113C30.539 8.801 30.4437 8.411 30.4437 7.943C30.4437 7.24967 30.7167 6.71667 31.2627 6.344C31.8087 5.96267 32.6494 5.75467 33.7847 5.72L34.9677 5.681V5.265C34.9677 4.68434 34.842 4.28134 34.5907 4.056C34.3394 3.83067 33.984 3.718 33.5247 3.718C33.1607 3.718 32.814 3.77434 32.4847 3.887C32.1554 3.991 31.8477 4.11234 31.5617 4.251L31.2107 3.393C31.514 3.22834 31.8737 3.08967 32.2897 2.977C32.7057 2.85567 33.139 2.795 33.5897 2.795ZM33.9277 6.513C33.061 6.54767 32.4587 6.68634 32.1207 6.929C31.7914 7.17167 31.6267 7.514 31.6267 7.956C31.6267 8.346 31.7437 8.632 31.9777 8.814C32.2204 8.996 32.528 9.087 32.9007 9.087C33.49 9.087 33.9797 8.92667 34.3697 8.606C34.7597 8.27667 34.9547 7.774 34.9547 7.098V6.474L33.9277 6.513ZM41.4878 2.782C41.6178 2.782 41.7565 2.79067 41.9038 2.808C42.0598 2.81667 42.1941 2.834 42.3068 2.86L42.1638 3.913C42.0511 3.887 41.9255 3.86534 41.7868 3.848C41.6568 3.83067 41.5311 3.822 41.4098 3.822C41.1411 3.822 40.8855 3.87834 40.6428 3.991C40.4001 4.10367 40.1835 4.264 39.9928 4.472C39.8021 4.67134 39.6505 4.914 39.5378 5.2C39.4338 5.486 39.3818 5.80667 39.3818 6.162V9.88H38.2378V2.912H39.1738L39.3038 4.186H39.3558C39.5031 3.926 39.6808 3.692 39.8888 3.484C40.0968 3.26734 40.3351 3.09834 40.6038 2.977C40.8725 2.847 41.1671 2.782 41.4878 2.782Z" fill="#8C8C8C"/>
                  </svg>
                }
              </div>
            }
            {
              !!recentSearches?.length && <div className={classes.search}>
                {recentSearches.slice(0, recentShowMore ? 10: 20).map((item, index) => {
                    return <div key={index} className={classes.searchItem} onClick={() => {
                        handleSearch(item?.keyword)
                    }}>{item?.keyword}</div>;
                })}
                { recentSearches?.length > 10 && <div className={classes.more} onClick={() => {
                  setRecentShowMore(!recentShowMore)
                }}>
                    <svg
                        style={{ transform: `rotate(${ recentShowMore ? '0deg' : '180deg' })`}}
                        width="12"
                        height="7"
                        viewBox="0 0 12 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5.26042 6.11979L0.260416 1.11979C-2.71946e-07 0.885416 -2.71946e-07 0.494791 0.260416 0.234375C0.494791 -3.50177e-07 0.885416 -3.50177e-07 1.14583 0.234375L5.70312 4.81771L10.2604 0.260416C10.4948 -3.50177e-07 10.8854 -3.50177e-07 11.1458 0.260416C11.3802 0.494791 11.3802 0.885416 11.1458 1.11979L6.11979 6.11979C5.88542 6.38021 5.49479 6.38021 5.26042 6.11979Z"
                            fill="#212121"
                        />
                    </svg>
                </div>}
              </div>
            }
            <div
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <span className={classes.title}>Hot Keywords</span>
                <svg
                    style={{ marginLeft: 10 }}
                    width="12"
                    height="17"
                    viewBox="0 0 12 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M6.75 1C6.75 4.21875 12 4.9375 12 10.25C12 13.5625 9.28125 16.25 6 16.25C2.6875 16.25 0 13.5625 0 10.25C0 8.4375 0.84375 6.9375 1.6875 6.0625C2.15625 5.5625 3 5.875 3 6.5625V9.25C3 10.3438 3.84375 11.25 4.96875 11.25C6.0625 11.2812 7 10.375 7 9.25C7 6.5 1.5 6.25 5.34375 0.59375C5.78125 0 6.75 0.28125 6.75 1Z"
                        fill="#FF0000"
                    />
                </svg>
            </div>
            <div className={classes.search} style={{ marginBottom: 16 }}>
                {combinedHotKeywords.slice(0, hotShowMore ? 10: 20).map((item, index) => {
                    return (
                        <div
                            key={index}
                            className={classes.searchItem}
                            style={
                                item?.isFromAd
                                    ? { backgroundColor: '#FFE1C9' }
                                    : undefined
                            }
                            onClick={() => handleHotKeywordClick(item)}
                        >
                            {item?.query_text}
                        </div>
                    );
                })}
                { combinedHotKeywords?.length > 10 && <div className={classes.more} onClick={() => {
                  setHotShowMore(!hotShowMore)
                }}>
                    <svg
                        style={{ transform: `rotate(${ hotShowMore ? '0deg' : '180deg' })`}}
                        width="12"
                        height="7"
                        viewBox="0 0 12 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5.26042 6.11979L0.260416 1.11979C-2.71946e-07 0.885416 -2.71946e-07 0.494791 0.260416 0.234375C0.494791 -3.50177e-07 0.885416 -3.50177e-07 1.14583 0.234375L5.70312 4.81771L10.2604 0.260416C10.4948 -3.50177e-07 10.8854 -3.50177e-07 11.1458 0.260416C11.3802 0.494791 11.3802 0.885416 11.1458 1.11979L6.11979 6.11979C5.88542 6.38021 5.49479 6.38021 5.26042 6.11979Z"
                            fill="#212121"
                        />
                    </svg>
                </div>}
            </div>
            <span className={classes.title}>
                Top Brands
            </span>
            <div className={classes.top} style={{ marginBottom: 16 }}>
                {topBrands.slice(0, 10).map((brand, index) => {
                    return (
                        <div className={classes.topList}  onClick={() => {
                          const brandUrl = brand?.brand_url || brand?.category_url;
                          // 如果 URL 不以 .html 结尾，则添加
                          const URLDirection = brandUrl.endsWith('.html') ? brandUrl : `${brandUrl}.html`
                          location.href = `${location.origin}/${URLDirection}`
                          setVisible(false)
                        }}>
                            {index === 0 && (
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.12793 7.9873L21.7183 19.0841C21.9983 19.2608 22.1348 19.6225 22.052 19.9672C21.9703 20.3114 21.6886 20.5506 21.3666 20.5511H6.8066C6.0891 20.5511 5.48243 19.962 5.39435 19.1756L4.12793 7.9873Z" fill="#FF9F0A"/>
                                <path d="M22.4719 19.1756C22.3838 19.962 21.7778 20.5511 21.0603 20.5511H7.00018C6.67759 20.5511 5.89651 20.312 5.81426 19.9678C5.73084 19.6242 5.86793 19.262 6.14793 19.0852L23.7366 7.9873L22.4708 19.1745V19.1756H22.4719Z" fill="#FF9F0A"/>
                                <path d="M14 5.29492L21.8458 18.1936C21.9864 18.4275 22.0654 18.6933 22.0755 18.9661C22.0856 19.2388 22.0265 19.5097 21.9036 19.7534C21.6539 20.2452 21.1721 20.5508 20.6488 20.5508H14V5.29492Z" fill="#FFB748"/>
                                <path d="M14.0004 5.29492L5.69371 18.3184C5.55313 18.5524 5.4741 18.8181 5.464 19.0909C5.4539 19.3637 5.51306 19.6345 5.63596 19.8783C5.88563 20.37 6.35521 20.5508 6.87846 20.5508H14.0004V5.29492Z" fill="#FFCF84"/>
                                <path d="M12.6265 4.83875C12.6265 5.31708 12.889 5.75867 13.3131 5.99842C13.7389 6.23758 14.2598 6.23758 14.6863 5.99842C14.8932 5.88333 15.0659 5.71529 15.1865 5.51151C15.3072 5.30774 15.3715 5.07556 15.3728 4.83875C15.3728 4.09967 14.758 3.5 13.9997 3.5C13.2413 3.5 12.6265 4.09967 12.6265 4.83875ZM22.9206 7.51683C22.9165 7.75696 22.9773 7.99374 23.0966 8.20218C23.2159 8.41061 23.3893 8.58295 23.5984 8.701C24.0272 8.946 24.5586 8.946 24.9885 8.701C25.1976 8.58283 25.371 8.41036 25.4902 8.20182C25.6094 7.99328 25.67 7.75642 25.6658 7.51625C25.65 6.78883 25.0398 6.20667 24.2932 6.20667C23.5471 6.20667 22.9381 6.78883 22.9206 7.51683ZM2.33417 7.51683C2.32251 8.001 2.58151 8.45483 3.01084 8.701C3.43959 8.946 3.97101 8.946 4.40092 8.701C4.61005 8.58283 4.78338 8.41036 4.90258 8.20182C5.02179 7.99328 5.08246 7.75642 5.07817 7.51625C5.06184 6.78883 4.45167 6.20667 3.70501 6.20667C2.95951 6.20667 2.34992 6.78883 2.33301 7.51683H2.33417ZM6.82001 22.3458H21.1788C21.7773 22.3458 22.0765 22.645 22.0765 23.2435C22.0765 23.8414 21.7773 24.1407 21.1788 24.1407H6.82001C6.22209 24.1407 5.92284 23.8414 5.92284 23.2435C5.92284 22.645 6.22209 22.3458 6.82001 22.3458Z" fill="#FF9F0A"/>
                                <path d="M14.785 19H12.893V14.765C12.893 14.6623 12.893 14.5193 12.893 14.336C12.893 14.1453 12.8967 13.9437 12.904 13.731C12.9113 13.511 12.9187 13.3203 12.926 13.159C12.8673 13.2323 12.7867 13.3203 12.684 13.423C12.5813 13.5183 12.486 13.6027 12.398 13.676L11.496 14.413L10.561 13.247L13.168 11.146H14.785V19Z" fill="white"/>
                                </svg>
                            )}
                            {index === 1 && (
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.12793 7.98718L21.7183 19.0839C21.9983 19.2607 22.1348 19.6223 22.052 19.9671C21.9703 20.3113 21.6886 20.5504 21.3666 20.551H6.8066C6.0891 20.551 5.48243 19.9618 5.39435 19.1755L4.12793 7.98718Z" fill="#8CABBD"/>
                                <path d="M22.4719 19.1755C22.3838 19.9618 21.7778 20.551 21.0603 20.551H7.00018C6.67759 20.551 5.89651 20.3118 5.81426 19.9677C5.73084 19.6241 5.86793 19.2618 6.14793 19.0851L23.7366 7.98718L22.4708 19.1743L22.4719 19.1755Z" fill="#8CABBD"/>
                                <path d="M14 5.29492L21.8458 18.1936C21.9864 18.4275 22.0654 18.6933 22.0755 18.9661C22.0856 19.2388 22.0265 19.5097 21.9036 19.7534C21.6539 20.2452 21.1721 20.5508 20.6488 20.5508H14V5.29492Z" fill="#B4C9D5"/>
                                <path d="M14.0004 5.29492L5.69371 18.3184C5.55313 18.5524 5.4741 18.8181 5.464 19.0909C5.4539 19.3637 5.51306 19.6345 5.63596 19.8783C5.88563 20.37 6.35521 20.5508 6.87846 20.5508H14.0004V5.29492Z" fill="#CFE9F9"/>
                                <path d="M12.6267 4.83875C12.6267 5.31708 12.8892 5.75867 13.3133 5.99842C13.7391 6.23758 14.26 6.23758 14.6864 5.99842C14.8934 5.88333 15.0661 5.71529 15.1867 5.51151C15.3073 5.30774 15.3716 5.07556 15.373 4.83875C15.373 4.09967 14.7582 3.5 13.9999 3.5C13.2415 3.5 12.6267 4.09967 12.6267 4.83875ZM22.9208 7.51683C22.9167 7.75696 22.9775 7.99374 23.0968 8.20218C23.2161 8.41061 23.3895 8.58295 23.5986 8.701C24.0274 8.946 24.5588 8.946 24.9887 8.701C25.1978 8.58283 25.3711 8.41036 25.4904 8.20182C25.6096 7.99328 25.6702 7.75642 25.6659 7.51625C25.6502 6.78883 25.04 6.20667 24.2934 6.20667C23.5473 6.20667 22.9383 6.78883 22.9208 7.51683ZM2.33436 7.51683C2.3227 8.001 2.5817 8.45483 3.01103 8.701C3.43978 8.946 3.9712 8.946 4.40111 8.701C4.61024 8.58283 4.78356 8.41036 4.90277 8.20182C5.02198 7.99328 5.08265 7.75642 5.07836 7.51625C5.06203 6.78883 4.45186 6.20667 3.7052 6.20667C2.9597 6.20667 2.35128 6.78883 2.33436 7.51683ZM6.8202 22.3458H21.1789C21.7774 22.3458 22.0767 22.645 22.0767 23.2435C22.0767 23.8414 21.7774 24.1407 21.1789 24.1407H6.8202C6.22228 24.1407 5.92303 23.8414 5.92303 23.2435C5.92303 22.645 6.22228 22.3458 6.8202 22.3458Z" fill="#8CABBD"/>
                                <path d="M15.973 20H10.385V18.735L12.332 16.766C12.728 16.3553 13.0433 16.018 13.278 15.754C13.5127 15.49 13.6777 15.259 13.773 15.061C13.8757 14.8557 13.927 14.6393 13.927 14.412C13.927 14.1333 13.8463 13.9317 13.685 13.807C13.5237 13.675 13.3147 13.609 13.058 13.609C12.7867 13.609 12.5153 13.6787 12.244 13.818C11.9727 13.9573 11.6793 14.159 11.364 14.423L10.341 13.224C10.5683 13.0187 10.8103 12.828 11.067 12.652C11.331 12.4687 11.6353 12.322 11.98 12.212C12.3247 12.0947 12.7427 12.036 13.234 12.036C13.762 12.036 14.213 12.1313 14.587 12.322C14.9683 12.5053 15.2617 12.7583 15.467 13.081C15.6797 13.3963 15.786 13.7593 15.786 14.17C15.786 14.5 15.7383 14.808 15.643 15.094C15.5477 15.3727 15.4047 15.644 15.214 15.908C15.0307 16.1647 14.7997 16.4323 14.521 16.711C14.2423 16.9897 13.927 17.294 13.575 17.624L12.761 18.372V18.438H15.973V20Z" fill="white"/>
                                </svg>

                            )}
                            {index === 2 && (
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.12793 7.98718L21.7183 19.0839C21.9983 19.2607 22.1348 19.6223 22.052 19.9671C21.9703 20.3113 21.6886 20.5504 21.3666 20.551H6.8066C6.0891 20.551 5.48243 19.9618 5.39435 19.1755L4.12793 7.98718Z" fill="#A86201"/>
                                <path d="M22.4719 19.1755C22.3838 19.9618 21.7778 20.551 21.0603 20.551H7.00018C6.67759 20.551 5.89651 20.3118 5.81426 19.9677C5.73084 19.6241 5.86793 19.2618 6.14793 19.0851L23.7366 7.98718L22.4708 19.1743V19.1755H22.4719Z" fill="#A86201"/>
                                <path d="M14 5.29492L21.8458 18.1936C21.9864 18.4275 22.0654 18.6933 22.0755 18.9661C22.0856 19.2388 22.0265 19.5097 21.9036 19.7534C21.6539 20.2452 21.1721 20.5508 20.6488 20.5508H14V5.29492Z" fill="#CF7D0C"/>
                                <path d="M14.0004 5.29492L5.69371 18.3184C5.55313 18.5524 5.4741 18.8181 5.464 19.0909C5.4539 19.3637 5.51306 19.6345 5.63596 19.8783C5.88563 20.37 6.35521 20.5508 6.87846 20.5508H14.0004V5.29492Z" fill="#F29D27"/>
                                <path d="M12.6265 4.83875C12.6265 5.31708 12.889 5.75867 13.3131 5.99842C13.7389 6.23758 14.2598 6.23758 14.6863 5.99842C14.8932 5.88333 15.0659 5.71529 15.1865 5.51151C15.3072 5.30774 15.3715 5.07556 15.3728 4.83875C15.3728 4.09967 14.758 3.5 13.9997 3.5C13.2413 3.5 12.6265 4.09967 12.6265 4.83875ZM22.9206 7.51683C22.9165 7.75696 22.9773 7.99374 23.0966 8.20218C23.2159 8.41061 23.3893 8.58295 23.5984 8.701C24.0272 8.946 24.5586 8.946 24.9885 8.701C25.1976 8.58283 25.371 8.41036 25.4902 8.20182C25.6094 7.99328 25.67 7.75642 25.6658 7.51625C25.65 6.78883 25.0398 6.20667 24.2932 6.20667C23.5471 6.20667 22.9381 6.78883 22.9206 7.51683ZM2.33417 7.51683C2.32251 8.001 2.58151 8.45483 3.01084 8.701C3.43959 8.946 3.97101 8.946 4.40092 8.701C4.61005 8.58283 4.78338 8.41036 4.90258 8.20182C5.02179 7.99328 5.08246 7.75642 5.07817 7.51625C5.06184 6.78883 4.45167 6.20667 3.70501 6.20667C2.95951 6.20667 2.34992 6.78883 2.33301 7.51683H2.33417ZM6.82001 22.3458H21.1788C21.7773 22.3458 22.0765 22.645 22.0765 23.2435C22.0765 23.8414 21.7773 24.1407 21.1788 24.1407H6.82001C6.22209 24.1407 5.92284 23.8414 5.92284 23.2435C5.92284 22.645 6.22209 22.3458 6.82001 22.3458Z" fill="#A86201"/>
                                <path d="M15.687 13.884C15.687 14.2507 15.61 14.566 15.456 14.83C15.302 15.094 15.0967 15.314 14.84 15.49C14.5833 15.6587 14.2937 15.7833 13.971 15.864V15.897C14.6017 15.9703 15.082 16.161 15.412 16.469C15.7493 16.777 15.918 17.1987 15.918 17.734C15.918 18.174 15.8043 18.5773 15.577 18.944C15.3497 19.3033 14.9977 19.5893 14.521 19.802C14.0517 20.0073 13.443 20.11 12.695 20.11C12.233 20.11 11.8187 20.0733 11.452 20C11.0853 19.9267 10.7333 19.8203 10.396 19.681V18.108C10.7407 18.284 11.0927 18.416 11.452 18.504C11.8187 18.5847 12.156 18.625 12.464 18.625C13.0213 18.625 13.4063 18.537 13.619 18.361C13.839 18.185 13.949 17.9357 13.949 17.613C13.949 17.415 13.8977 17.2463 13.795 17.107C13.6923 16.9677 13.5127 16.8613 13.256 16.788C12.9993 16.7147 12.6327 16.678 12.156 16.678H11.617V15.259H12.167C12.6143 15.259 12.959 15.2187 13.201 15.138C13.4503 15.0573 13.6227 14.9473 13.718 14.808C13.8133 14.6613 13.861 14.4963 13.861 14.313C13.861 14.0637 13.7767 13.873 13.608 13.741C13.4393 13.609 13.1863 13.543 12.849 13.543C12.607 13.543 12.3833 13.576 12.178 13.642C11.9727 13.708 11.7893 13.7813 11.628 13.862C11.4667 13.9427 11.3347 14.016 11.232 14.082L10.407 12.817C10.6197 12.6703 10.8507 12.5383 11.1 12.421C11.3567 12.2963 11.6427 12.201 11.958 12.135C12.2807 12.069 12.651 12.036 13.069 12.036C13.8757 12.036 14.5137 12.201 14.983 12.531C15.4523 12.8537 15.687 13.3047 15.687 13.884Z" fill="white"/>
                                </svg>
                            )}
                            {![0, 1, 2].includes(index) && (
                                <div className={classes.topListIndex}>
                                    {index + 1 }
                                </div>
                            )}
                            <div className={classes.brand}>
                              <img src={brand?.logo_url} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <span className={classes.title}>
                Trending products
            </span>
            <div style={{ marginTop: 8 }}>
              <RichContent html={content} classes={{ root: classes.wrapItem }} />
            </div>
            {/* <CmsBlock identifiers={['product_trending_search_enhancements']} /> */}
            {/* <div
                style={dynamicStyles}
            >
                <Carousel settings={carouselSettings} items={items} />
            </div> */}
        </div>
    );
};

export default newRecentSearch;

const SEARCH_BLOCK_ENHANCEMENT_MULTIPLE = gql`
  query SearchBlockEnhancement {
    searchBlockEnhancement{
        hotKeywords(limit: 20){
            query_text
            num_results
            popularity
            redirect_url
            display_in_terms
            is_hot_keyword
            label
        }
        recent_searches(limit: 20){
            keyword
            updated_at
        }
        topBrands(limit: 20){
            brand_url
            logo_url
            position
            label
        }
    }
}
`

const SEARCH_BLOCK_ENHANCEMENT = gql`
  query {
    searchBlockEnhancement {
      recent_searches(limit: 20) {
        keyword
        updated_at
      }
    }
  }
`

const CLEAR_RECENT_SEARCHES = gql`
  mutation {
    clearRecentSearches {
      success
      message
    }
  }
`

const GET_HOT_KEYWORDS = gql`
  query {
    searchBlockEnhancement {
      hotKeywords(limit: 20) {
        query_text
        num_results
        popularity
        redirect_url
        display_in_terms
        is_hot_keyword
        label
        __typename
      }
    }
  }
`

const GET_TOP_BRANDS = gql`
  query {
    searchBlockEnhancement {
      topBrands(limit: 12) {
        brand_url
        logo_url
        position
        label
        __typename
      }
    }
  }
`

const CMS_BLOCKS = gql`
  query cmsBlocks($identifiers:[String]!){
      cmsBlocks(identifiers:$identifiers){
          items{
              content
              identifier
              __typename
          }
          __typename
      }
  }
`
