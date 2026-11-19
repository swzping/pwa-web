import React from 'react';
import { render } from 'react-dom';

import store from './store';
import app from '@magento/peregrine/lib/store/actions/app';
import Adapter from '@magento/venia-ui/lib/components/Adapter';
import { registerSW } from './registerSW';
import { registerInitTrack } from './lib/tracking'; // 引入抽离的初始化函数
import './index.css';
import getOnlineSalesSDK from 'online-sales-sdk';
import setupAdsDevProxy from './lib/setupAdsDevProxy';
import createRefreshTokenLink from './overrides/peregrine/Apollo/links/refreshTokenLink';

// server rendering differs from browser rendering
const isServer = !globalThis.document;

// TODO: on the server, the http request should provide the origin
const origin = isServer
    ? process.env.MAGENTO_BACKEND_URL
    : globalThis.location.origin;

// on the server, components add styles to this set and we render them in bulk
const styles = new Set();

/**
 * Inject OAuth refresh link before stock Peregrine links (order matches override index.js).
 * Do not alias `@magento/peregrine/lib/Apollo/links` — it breaks subpath imports like authLink.
 */
const configureLinks = (links, apiBase) => {
    const next = new Map();
    next.set('REFRESH_TOKEN', createRefreshTokenLink(apiBase));
    for (const [key, link] of links) {
        next.set(key, link);
    }
    return next;
};

const tree = (
    <Adapter
        configureLinks={configureLinks}
        origin={origin}
        store={store}
        styles={styles}
    />
);

if (isServer) {
    // TODO: ensure this actually renders correctly
    import('react-dom/server').then(({ default: ReactDOMServer }) => {
        console.log(ReactDOMServer.renderToString(tree));
    });
} else {
    setupAdsDevProxy();
    render(tree, document.getElementById('root'));
    registerSW();
    const onlineSalesSDK = getOnlineSalesSDK();
    const displayAdsHost = process.env.DISPLAY_ADS_HOST;
    const clientId = Number(process.env.ONLINE_SALES_CLIENT_ID);
    onlineSalesSDK.initialize({
        clientId,
        productAdsHost: displayAdsHost,
        displayAdsHost: displayAdsHost,
        eventTrackingHost: displayAdsHost,
        fireDefaultPixel:false
    }).then(() => {
        console.log('OnlineSalesSDK 全局初始化完成');
        window.onlineSalesSDK = onlineSalesSDK;
    }).catch(e => {
        console.error('OnlineSalesSDK 初始化失败', e);
    });
    globalThis.addEventListener('online', () => {
        store.dispatch(app.setOnline());
    });
    globalThis.addEventListener('offline', () => {
        store.dispatch(app.setOffline());
    });
    registerInitTrack();
}
