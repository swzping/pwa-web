import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import { BrowserPersistence } from '@magento/peregrine/lib/util';
import { print } from 'graphql/language/printer';
import {
    OSMOS_GET_BRAND_LIST,
    OSMOS_GET_CATEGORY_BY_ID,
    OSMOS_GET_CATEGORY_BY_UID,
    OSMOS_GET_PRODUCT_BY_SKU,
    OSMOS_GET_STORE_SUFFIX,
    OSMOS_GET_VES_MENU
} from './osmosNavigation.gql';

const storage = new BrowserPersistence();

const OSMOS_CUSTOM_PARAM_1 = 'GUID';

export const OSMOS_CLICK_TYPE = {
    URL: 'URL',
    CATEGORY: 'CATEGORY',
    PRODUCT: 'PRODUCT',
    BRAND: 'BRAND'
};

let storeSuffixCache = null;
let storeSuffixCacheKey = null;

/** attribute_id -> brand item，避免每次点击都 network-only 拉全量 getBrandList */
let brandListByIdCache = null;
let brandListCacheFetchedAt = 0;
const BRAND_LIST_CACHE_TTL_MS = 10 * 60 * 1000;

const pickNullish = (...values) => {
    for (let i = 0; i < values.length; i++) {
        if (values[i] != null) {
            return values[i];
        }
    }
    return values.length ? values[values.length - 1] : '';
};

const trimValue = value =>
    value == null || value === '' ? '' : String(value).trim();

export const normalizeOsmosClickType = clickType => {
    const normalized = trimValue(clickType).toUpperCase();

    if (normalized === OSMOS_CLICK_TYPE.CATEGORY) {
        return OSMOS_CLICK_TYPE.CATEGORY;
    }
    if (
        normalized === OSMOS_CLICK_TYPE.PRODUCT ||
        normalized === 'SKU' ||
        normalized === 'PLA' ||
        normalized === 'PDP'
    ) {
        return OSMOS_CLICK_TYPE.PRODUCT;
    }
    if (normalized === OSMOS_CLICK_TYPE.BRAND) {
        return OSMOS_CLICK_TYPE.BRAND;
    }
    if (normalized === OSMOS_CLICK_TYPE.URL) {
        return OSMOS_CLICK_TYPE.URL;
    }

    return OSMOS_CLICK_TYPE.URL;
};

export const normalizeOsmosClick = (elements = {}, item = {}) => {
    const rawClickTypeStr = trimValue(
        pickNullish(
            elements && elements.clickType,
            elements && elements.click_type,
            item && item.clickType,
            item && item.click_type,
            ''
        )
    );

    let clickType;
    if (/^product$/i.test(rawClickTypeStr)) {
        clickType = OSMOS_CLICK_TYPE.PRODUCT;
    } else if (/^category$/i.test(rawClickTypeStr)) {
        clickType = OSMOS_CLICK_TYPE.CATEGORY;
    } else if (/^brand$/i.test(rawClickTypeStr)) {
        clickType = OSMOS_CLICK_TYPE.BRAND;
    } else {
        clickType = normalizeOsmosClickType(rawClickTypeStr);
    }

    const rawValue =
        clickType === OSMOS_CLICK_TYPE.URL
            ? pickNullish(
                  elements && elements.clickValue,
                  elements && elements.click_value,
                  elements && elements.url,
                  elements && elements.urlTc,
                  item && item.url,
                  item && item.clickValue,
                  item && item.click_value,
                  ''
              )
            : pickNullish(
                  elements && elements.clickValue,
                  elements && elements.click_value,
                  elements && elements.sku,
                  elements && elements.productId,
                  elements && elements.productSku,
                  item && item.clickValue,
                  item && item.click_value,
                  item && item.sku,
                  ''
              );
    const clickValue = trimValue(rawValue);

    return {
        clickType,
        clickValue,
        link: clickType === OSMOS_CLICK_TYPE.URL ? clickValue : ''
    };
};

const hasOsmosClickTarget = ({ clickType, clickValue, link }) => {
    if (clickType && clickType !== OSMOS_CLICK_TYPE.URL) {
        return !!trimValue(clickValue);
    }

    return !!trimValue(clickValue || link);
};

const isExternalUrl = value =>
    value.startsWith('http://') || value.startsWith('https://');

const isInternalUrl = (url, origin) => {
    if (!url) {
        return false;
    }

    const pageOrigin =
        origin ||
        (globalThis.location && globalThis.location.origin) ||
        '';

    return url.startsWith('/') || (pageOrigin && url.startsWith(pageOrigin));
};

const OSMOS_GRAPHQL_ROOT_KEYS = [
    'products',
    'categoryList',
    'categories',
    'storeConfig',
    'getBrandList',
    'vesMenu'
];

const hasGraphQLRootPayload = node =>
    !!node &&
    typeof node === 'object' &&
    OSMOS_GRAPHQL_ROOT_KEYS.some(key => node[key] != null);

/** 剥掉多余的 data 嵌套，直到出现 products / categoryList 等字段 */
const unwrapNestedGraphQLData = payload => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    let current = payload;
    let depth = 0;

    while (
        depth < 5 &&
        current &&
        typeof current === 'object' &&
        current.data &&
        typeof current.data === 'object' &&
        !hasGraphQLRootPayload(current)
    ) {
        current = current.data;
        depth += 1;
    }

    return current;
};

/** 仅在 GraphQL payload 内查找业务根节点，避免扫到 Apollo client 缓存 */
const findGraphQLDataRoot = root => {
    if (!root || typeof root !== 'object') {
        return null;
    }

    const stack = [root];
    const seen = new Set();
    let fallback = null;

    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object' || seen.has(node)) {
            continue;
        }
        seen.add(node);

        if (hasGraphQLRootPayload(node)) {
            return node;
        }

        if (
            !fallback &&
            OSMOS_GRAPHQL_ROOT_KEYS.some(key => Object.prototype.hasOwnProperty.call(node, key))
        ) {
            fallback = node;
        }

        for (const value of Object.values(node)) {
            if (value && typeof value === 'object') {
                stack.push(value);
            }
        }
    }

    return fallback;
};

const collectApolloPayloadCandidates = source => {
    if (!source || typeof source !== 'object') {
        return [];
    }

    const candidates = [
        source.data,
        source.data && source.data.data,
        source.networkResult && source.networkResult.data,
        source.networkResult &&
            source.networkResult.data &&
            source.networkResult.data.data,
        source.result && source.result.data,
        source.result && source.result.data && source.result.data.data
    ];

    const networkError = source.networkError;
    if (networkError && networkError.result) {
        candidates.push(networkError.result.data);
        if (networkError.result.data && networkError.result.data.data) {
            candidates.push(networkError.result.data.data);
        }
    }

    return candidates.filter(Boolean);
};

const getGraphQLEndpoint = () => `${globalThis.location.origin}/graphql`;

const buildGraphQLFetchHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    const storeCode =
        storage.getItem('store_view_code') ||
        (typeof STORE_VIEW_CODE !== 'undefined' ? STORE_VIEW_CODE : '');
    const token = storage.getItem('signin_token');

    if (storeCode) {
        headers.store = storeCode;
    }
    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    return headers;
};

/** Apollo query 返回 data:null 时，用 POST fetch 直接读 Network 同款响应 */
const fetchGraphQLPayload = async (document, variables) => {
    const endpoint = getGraphQLEndpoint();
    const operationName =
        document.definitions &&
        document.definitions[0] &&
        document.definitions[0].name &&
        document.definitions[0].name.value;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: buildGraphQLFetchHeaders(),
        credentials: 'include',
        body: JSON.stringify({
            operationName,
            query: print(document),
            variables
        })
    });

    return response.json().catch(() => null);
};

const extractApolloGraphQLData = source => {
    const candidates = collectApolloPayloadCandidates(source);

    for (const candidate of candidates) {
        const unwrapped = unwrapNestedGraphQLData(candidate);
        const root = findGraphQLDataRoot(unwrapped) || unwrapped;
        if (hasGraphQLRootPayload(root)) {
            return root;
        }
    }

    const root = findGraphQLDataRoot(source);
    return hasGraphQLRootPayload(root) ? root : null;
};

const pickProductsItems = source => {
    if (!source) {
        return [];
    }

    const paths = [
        source?.data?.data?.products?.items,
        source?.data?.products?.items,
        source?.products?.items
    ];

    for (const items of paths) {
        if (Array.isArray(items) && items.length) {
            return items;
        }
    }

    for (const items of paths) {
        if (Array.isArray(items)) {
            return items;
        }
    }

    const root = extractApolloGraphQLData(source);
    const items =
        root && root.products && root.products.items ? root.products.items : [];
    return Array.isArray(items) ? items : [];
};

const queryApollo = async (
    apolloClient,
    document,
    variables,
    { fetchPolicy = 'network-only' } = {}
) => {
    if (!apolloClient) {
        return null;
    }

    try {
        const result = await apolloClient.query({
            query: document,
            variables,
            fetchPolicy,
            errorPolicy: 'all'
        });

        return extractApolloGraphQLData(result);
    } catch (error) {
        return extractApolloGraphQLData(error);
    }
};

const isNumericCategoryId = value => /^\d+$/.test(String(value).trim());

const isLikelyCategoryUid = value => {
    const normalized = String(value).trim();
    return (
        normalized.length > 0 &&
        !isNumericCategoryId(normalized) &&
        /^[A-Za-z0-9+/]+=*$/.test(normalized)
    );
};

const getCategoryFromQueryData = data => {
    if (data && data.categoryList && data.categoryList.length) {
        return data.categoryList[0];
    }

    return (
        data &&
        data.categories &&
        data.categories.items &&
        data.categories.items[0]
    );
};

const toCategoryUid = value => {
    try {
        return btoa(String(value));
    } catch (error) {
        return String(value);
    }
};

const getCurrentStoreCode = () =>
    storage.getItem('store_view_code') ||
    (typeof STORE_VIEW_CODE !== 'undefined' ? STORE_VIEW_CODE : '');

const getVesMenuAlias = () => process.env.VESMENU_ALIAS || 'top-menu';

const extractVesMenuLinkPath = link => {
    if (!link) {
        return '';
    }

    const baseURLPattern = /^.+?[^/:](?=[?/]|$)\//gm;
    return link.replace(baseURLPattern, '');
};

const findVesMenuLinkByCategoryId = (items, categoryId) => {
    if (!items || !items.length) {
        return null;
    }

    const targetId = String(categoryId);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) {
            continue;
        }

        if (
            item.category_id != null &&
            String(item.category_id) === targetId &&
            item.link
        ) {
            return item.link;
        }

        const childLink = findVesMenuLinkByCategoryId(item.children, categoryId);
        if (childLink) {
            return childLink;
        }
    }

    return null;
};

const readVesMenuQueryData = apolloClient => {
    try {
        return apolloClient.readQuery({
            query: OSMOS_GET_VES_MENU,
            variables: { alias: getVesMenuAlias() }
        });
    } catch (error) {
        return null;
    }
};

const pickCategoryUrlSegment = category => {
    const urlPath = trimValue(category.url_path);
    const urlKey = trimValue(category.url_key);

    if (urlPath && urlKey && urlPath !== urlKey) {
        if (urlPath.endsWith(`/${urlKey}`) || urlPath === urlKey) {
            return urlPath;
        }
    }

    return pickNullish(urlKey, urlPath);
};

const buildCategoryPath = async (apolloClient, category) => {
    const segment = category && pickCategoryUrlSegment(category);
    if (!segment) {
        return null;
    }

    const { categoryUrlSuffix } = await getStoreSuffix(apolloClient);
    return resourceUrl(`/${segment}${categoryUrlSuffix || ''}`);
};

const splitPathAndQuery = value => {
    const normalized = trimValue(value);
    if (!normalized) {
        return { pathname: '', search: '' };
    }

    const queryIndex = normalized.indexOf('?');
    if (queryIndex === -1) {
        return { pathname: normalized, search: '' };
    }

    return {
        pathname: normalized.slice(0, queryIndex),
        search: normalized.slice(queryIndex)
    };
};

const normalizeInternalPath = value => {
    const { pathname, search } = splitPathAndQuery(value);
    if (!pathname) {
        return null;
    }

    let path = pathname;
    if (isExternalUrl(pathname)) {
        try {
            const url = new URL(pathname);
            path = url.pathname;
        } catch (error) {
            return null;
        }
    }

    if (!path.startsWith('/')) {
        path = `/${path.replace(/^\//, '')}`;
    }

    const pathWithoutSuffix = path.replace(/\.html$/i, '');
    if (!pathWithoutSuffix || pathWithoutSuffix === '/') {
        return null;
    }

    return { pathname: pathWithoutSuffix, search };
};

const buildPathFromLandingUrl = async (apolloClient, landingUrl) => {
    const parsed = normalizeInternalPath(landingUrl);
    if (!parsed) {
        return null;
    }

    const { categoryUrlSuffix } = await getStoreSuffix(apolloClient);
    const suffix = categoryUrlSuffix || '';
    const hasSuffix = parsed.pathname.endsWith(suffix);
    const pathname = hasSuffix
        ? parsed.pathname
        : resourceUrl(`${parsed.pathname}${suffix}`);

    return `${pathname}${parsed.search || ''}`;
};

const resolveCategoryPathFromVesMenu = async (apolloClient, categoryId) => {
    let data = readVesMenuQueryData(apolloClient);

    if (!data) {
        data = await queryApollo(apolloClient, OSMOS_GET_VES_MENU, {
            alias: getVesMenuAlias()
        });
    }

    const items = data && data.vesMenu && data.vesMenu.items;
    const link = findVesMenuLinkByCategoryId(items, categoryId);
    if (!link) {
        return null;
    }

    const relativePath = extractVesMenuLinkPath(link);
    if (!relativePath) {
        return null;
    }

    return buildPathFromLandingUrl(apolloClient, relativePath);
};

const getStoreSuffix = async apolloClient => {
    const cacheKey = getCurrentStoreCode() || 'default';

    if (storeSuffixCache && storeSuffixCacheKey === cacheKey) {
        return storeSuffixCache;
    }

    const data = await queryApollo(apolloClient, OSMOS_GET_STORE_SUFFIX, undefined, {
        fetchPolicy: 'cache-first'
    });
    storeSuffixCacheKey = cacheKey;
    storeSuffixCache = {
        categoryUrlSuffix: pickNullish(
            data &&
                data.storeConfig &&
                data.storeConfig.category_url_suffix,
            '.html'
        ),
        productUrlSuffix: pickNullish(
            data &&
                data.storeConfig &&
                data.storeConfig.product_url_suffix,
            '.html'
        )
    };

    return storeSuffixCache;
};

const navigateToPath = (history, path, { forceReload = false } = {}) => {
    if (!path) {
        return;
    }

    const normalizedPath = path.startsWith('/')
        ? path
        : `/${path.replace(/^\//, '')}`;

    if (history && typeof history.push === 'function') {
        history.push(normalizedPath);
    }

    if (forceReload || !history || typeof history.push !== 'function') {
        globalThis.location.href = normalizedPath;
    }
};

const navigateOsmosUrl = (history, link) => {
    if (!link) {
        return;
    }

    if (isInternalUrl(link)) {
        const path = link.startsWith('/')
            ? link
            : link.replace(globalThis.location.origin, '');
        navigateToPath(history, path);
        return;
    }

    if (isExternalUrl(link)) {
        globalThis.location.assign(link);
        return;
    }

    navigateToPath(history, `/${link.replace(/^\//, '')}`);
};

const resolveCategoryPath = async (apolloClient, categoryId, landingUrl) => {
    const landingPath = await buildPathFromLandingUrl(apolloClient, landingUrl);
    if (landingPath) {
        return landingPath;
    }

    const id = String(categoryId).trim();
    if (!id) {
        return null;
    }

    let category = null;

    if (isNumericCategoryId(id)) {
        const vesMenuPath = await resolveCategoryPathFromVesMenu(
            apolloClient,
            id
        );
        if (vesMenuPath) {
            return vesMenuPath;
        }

        const data = await queryApollo(apolloClient, OSMOS_GET_CATEGORY_BY_ID, {
            id
        });
        category = getCategoryFromQueryData(data);

        if (!category) {
            const uidData = await queryApollo(
                apolloClient,
                OSMOS_GET_CATEGORY_BY_UID,
                { uid: toCategoryUid(id) }
            );
            category = getCategoryFromQueryData(uidData);
        }
    } else if (isLikelyCategoryUid(id)) {
        const uidData = await queryApollo(
            apolloClient,
            OSMOS_GET_CATEGORY_BY_UID,
            { uid: id }
        );
        category = getCategoryFromQueryData(uidData);
    } else {
        const parsed = normalizeInternalPath(id);
        if (parsed) {
            return buildPathFromLandingUrl(
                apolloClient,
                `${parsed.pathname}${parsed.search || ''}`
            );
        }
    }

    return buildCategoryPath(apolloClient, category);
};

const resolveProductPath = async (apolloClient, productId) => {
    const sku = String(productId).trim();
    if (!sku) {
        return null;
    }

    let rawResult = null;
    let fetchJson = null;

    if (apolloClient) {
        try {
            rawResult = await apolloClient.query({
                query: OSMOS_GET_PRODUCT_BY_SKU,
                variables: { sku },
                fetchPolicy: 'network-only',
                errorPolicy: 'all',
                context: {
                    fetchOptions: {
                        method: 'POST'
                    }
                }
            });
        } catch (error) {
            rawResult = error;
        }
    }

    let items = pickProductsItems(rawResult);

    if (!items.length) {
        try {
            fetchJson = await fetchGraphQLPayload(OSMOS_GET_PRODUCT_BY_SKU, {
                sku
            });
            items = pickProductsItems(fetchJson);
        } catch (error) {
            void error;
        }
    }

    const product = items.find(item => item && item.url_key);

    if (!product || !product.url_key) {
        return null;
    }

    const { productUrlSuffix } = await getStoreSuffix(apolloClient);

    return resourceUrl(
        `/${product.url_key}${productUrlSuffix || '.html'}`
    );
};

export const resolveOsmosProductPath = resolveProductPath;

const indexBrandListItems = items => {
    const map = new Map();
    if (!Array.isArray(items)) {
        return map;
    }

    items.forEach(item => {
        if (item?.attribute_id != null) {
            map.set(String(item.attribute_id), item);
        }
    });

    return map;
};

const readBrandListFromApolloCache = apolloClient => {
    if (!apolloClient) {
        return null;
    }

    try {
        const data = apolloClient.readQuery({ query: OSMOS_GET_BRAND_LIST });
        return data?.getBrandList?.items || null;
    } catch (error) {
        void error;
        return null;
    }
};

const ensureBrandListCache = async apolloClient => {
    if (
        brandListByIdCache &&
        Date.now() - brandListCacheFetchedAt < BRAND_LIST_CACHE_TTL_MS
    ) {
        return brandListByIdCache;
    }

    let items = readBrandListFromApolloCache(apolloClient);
    if (!items?.length) {
        const data = await queryApollo(
            apolloClient,
            OSMOS_GET_BRAND_LIST,
            undefined,
            { fetchPolicy: 'cache-first' }
        );
        items = (data && data.getBrandList && data.getBrandList.items) || [];
    }

    brandListByIdCache = indexBrandListItems(items);
    brandListCacheFetchedAt = Date.now();
    return brandListByIdCache;
};

/** 广告展示后预拉品牌列表，减少首次点击等待 */
export const warmOsmosBrandListCache = apolloClient =>
    ensureBrandListCache(apolloClient).catch(() => null);

const resolveBrandPath = async (apolloClient, brandId) => {
    const targetId = String(brandId);
    const brandMap = await ensureBrandListCache(apolloClient);
    const brand = brandMap.get(targetId);

    if (!brand || !brand.category_url) {
        return null;
    }

    const { categoryUrlSuffix } = await getStoreSuffix(apolloClient);
    const categoryUrl = trimValue(brand.category_url);

    if (categoryUrl.startsWith('http://') || categoryUrl.startsWith('https://')) {
        return categoryUrl;
    }

    if (categoryUrl.startsWith('/')) {
        return resourceUrl(`${categoryUrl}${categoryUrlSuffix}`);
    }

    return resourceUrl(`/${categoryUrl}${categoryUrlSuffix}`);
};

export const prefetchOsmosAdNavigation = async (apolloClient, ad = {}) => {
    const clickType = normalizeOsmosClickType(ad.clickType);
    const clickValue = trimValue(pickNullish(ad.clickValue, ad.link));

    if (!hasOsmosClickTarget({ clickType, clickValue, link: ad.link })) {
        return null;
    }

    switch (clickType) {
        case OSMOS_CLICK_TYPE.PRODUCT:
            return resolveProductPath(apolloClient, clickValue);
        case OSMOS_CLICK_TYPE.CATEGORY:
            return resolveCategoryPath(
                apolloClient,
                clickValue,
                ad.landingUrl
            );
        case OSMOS_CLICK_TYPE.BRAND:
            return resolveBrandPath(apolloClient, clickValue);
        case OSMOS_CLICK_TYPE.URL:
        default: {
            const target = clickValue || ad.link;
            if (isExternalUrl(target)) {
                return target;
            }
            const parsed = normalizeInternalPath(target);
            if (parsed) {
                return `${parsed.pathname}${parsed.search || ''}`;
            }
            return target.startsWith('/')
                ? target
                : `/${target.replace(/^\//, '')}`;
        }
    }
};

export const registerOsmosAdClick = async ({ uclid, cliUbid }) => {
    if (!uclid) {
        return;
    }

    const sdk = globalThis.onlineSalesSDK;
    if (!sdk || !sdk.registerAdClickEvent) {
        return;
    }

    try {
        await sdk.registerAdClickEvent({
            cliUbid,
            'f.custom_label_1': OSMOS_CUSTOM_PARAM_1,
            uclid
        });
    } catch (error) {
        void error;
    }
};

export const handleOsmosAdClick = async ({
    link,
    clickType: rawClickType,
    clickValue: rawClickValue,
    landingUrl,
    uclid,
    cliUbid,
    history,
    apolloClient
}) => {
    const clickType = normalizeOsmosClickType(rawClickType);
    const clickValue = trimValue(
        clickType === OSMOS_CLICK_TYPE.URL
            ? pickNullish(rawClickValue, link)
            : rawClickValue
    );

    if (!hasOsmosClickTarget({ clickType, clickValue, link })) {
        return;
    }

    void registerOsmosAdClick({ uclid, cliUbid });

    try {
        switch (clickType) {
            case OSMOS_CLICK_TYPE.CATEGORY: {
                const path = await resolveCategoryPath(
                    apolloClient,
                    clickValue,
                    landingUrl
                );
                if (path) {
                    navigateToPath(history, path);
                }
                return;
            }
            case OSMOS_CLICK_TYPE.PRODUCT: {
                const path = await resolveProductPath(apolloClient, clickValue);
                if (path) {
                    navigateToPath(history, path);
                }
                return;
            }
            case OSMOS_CLICK_TYPE.BRAND: {
                const path = await resolveBrandPath(apolloClient, clickValue);
                if (!path) {
                    return;
                }
                if (isExternalUrl(path)) {
                    globalThis.location.assign(path);
                } else {
                    navigateToPath(history, path);
                }
                return;
            }
            case OSMOS_CLICK_TYPE.URL:
            default:
                navigateOsmosUrl(history, clickValue || link);
        }
    } catch (error) {
        void error;
    }
};

export const buildOsmosAdItem = (item, elementsOverride = null) => {
    const elements =
        elementsOverride || (item && item.elements) || {};
    const click = normalizeOsmosClick(elements, item);
    const landingUrl = trimValue(
        pickNullish(
            elements.urlTc,
            elements.url,
            item && item.url
        )
    );

    return {
        image:
            elements.imageId ||
            elements.image ||
            elements.imageTc ||
            (item && item.image) ||
            '',
        uclid: (item && item.uclid) || '',
        rank: (item && item.rank) || 0,
        link: click.link,
        clickType: click.clickType,
        clickValue: click.clickValue,
        landingUrl
    };
};
