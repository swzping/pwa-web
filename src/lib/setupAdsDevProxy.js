/**
 * 本地开发：将广告 API 请求改走 webpack 同源代理，绕过 dev 环境对 Origin: localhost 的 403。
 * Osmos SDK 使用 XMLHttpRequest，需 patch open()。需配合 webpack /ads-proxy-dev 代理。
 */
const ADS_DEV_HOST = 'dev-ads-id.dfgd-os.com';

function rewriteAdsUrl(url) {
    const adsOrigin = `https://${ADS_DEV_HOST}`;
    if (typeof url !== 'string' || !url.startsWith(adsOrigin)) {
        return url;
    }
    return `${globalThis.location.origin}/ads-proxy-dev${url.slice(adsOrigin.length)}`;
}

export default function setupAdsDevProxy() {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
        return;
    }
    if (!globalThis.location || typeof XMLHttpRequest === 'undefined') {
        return;
    }
    if (globalThis.__adsDevProxyPatched) {
        return;
    }
    globalThis.__adsDevProxyPatched = true;

    const nativeOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
        return nativeOpen.call(this, method, rewriteAdsUrl(url), ...rest);
    };

    if (typeof globalThis.fetch === 'function') {
        const nativeFetch = globalThis.fetch.bind(globalThis);
        globalThis.fetch = function patchedFetch(input, init) {
            let url =
                typeof input === 'string'
                    ? input
                    : input instanceof Request
                      ? input.url
                      : String(input);
            const rewritten = rewriteAdsUrl(url);
            if (rewritten !== url) {
                if (input instanceof Request) {
                    input = new Request(rewritten, input);
                } else {
                    input = rewritten;
                }
            }
            return nativeFetch(input, init);
        };
    }
}
