module.exports = targets => {
    const buildpackTargets = targets.of('@magento/pwa-buildpack');

    buildpackTargets.envVarDefinitions.tap(defs => {
        defs.sections.push({
            name: 'Custom Environment',
            variables: [
                {
                    name: 'ENABLE_TRACKING_GTM',
                    type: 'bool',
                    desc: 'Service google tag manager tracking'
                },
                {
                    name: 'GTM_DEBUG',
                    type: 'bool',
                    desc: 'Console.log Service google tag manager tracking'
                },
                {
                    name: 'GTM_ID',
                    type: 'str',
                    desc: 'google tag manager id'
                },
                {
                    name: 'GOOGLE_MAPS_APIKEY',
                    type: 'str',
                    desc: 'google maps apikey'
                },
                {
                    name: 'STORELOCATOR_SEARCHBOX_ENABLE',
                    type: 'bool',
                    desc:
                        'to identify searchbox by store locator module is enable'
                },
                {
                    name: 'VESMENU_ENABLE',
                    type: 'bool',
                    desc: 'to identify vesmenu module is enable'
                },
                {
                    name: 'VESMENU_ALIAS',
                    type: 'str',
                    desc: 'default value to query vesmenu gql'
                },
                {
                    name: 'GIFT_CARD_ENABLE',
                    type: 'bool',
                    desc: 'to identify gift card module is enable'
                },
                {
                    name: 'USE_COMMERCE_MODULE',
                    type: 'str',
                    desc: 'to identify commerce module is enable'
                },
                {
                    name: 'COMPARE_PRODUCT_ENABLE',
                    type: 'bool',
                    desc: 'to identify compare product module is enable'
                },
                {
                    name: 'CONFIRM_PAYMENT_ENABLE',
                    type: 'bool',
                    desc: 'to identify confirm payment module is enable'
                },
                {
                    name: 'APOTEKER_CHAT_ENABLE',
                    type: 'bool',
                    desc: 'to identify apoteker chat module is enable'
                },
                {
                    name: 'GALLERYITEM_QUICKVIEW_ENABLE',
                    type: 'bool',
                    desc: 'to identify gallery item quick view is enable'
                },
                {
                    name: 'FACEBOOK_PIXEL_ENABLE',
                    type: 'bool',
                    desc: 'to identify facebook pixel tracking is enable'
                },
                {
                    name: 'FACEBOOK_PIXEL_ID',
                    type: 'str',
                    desc: 'to identify id facebook pixel tracking is enable'
                },
                {
                    name: 'TIKTOK_PIXEL_ID',
                    type: 'str',
                    desc: 'to identify id tiktok pixel integration for ads​ is enable'
                },
                {
                    name: 'QD_TRACKER_APP_KEY',
                    type: 'str',
                    desc: 'tracker app key for QD tracking sdk'
                },
                {
                    name: 'QD_CDP_REQUEST_BASE_URL',
                    type: 'str',
                    desc: 'request base url for QD tracking sdk'
                }
            ]
        });
    });
};
