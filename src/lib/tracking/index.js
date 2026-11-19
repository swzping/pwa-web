import { trackCommonDataMemberId } from '@/utils/track';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';

const storage = new BrowserPersistence();

// 获取埋点配置
async function loadTrackConfig() {    
    return {
        appKey: process.env.QD_TRACKER_APP_KEY,
        apiUrl: process.env.QD_CDP_REQUEST_BASE_URL,
        encryptMode: 'close', // default - base64加密 ｜ close - 不加密 ｜ aes - aes加密
    };
}

async function initTracking() {
    try {
        await import('./QDTracker_es.js'); // 动态导入 QDTracker 脚本
        await import('./AES_SEC.js'); // 引入AES加密包
        // 动态导入 autoTrack 模块并赋值给变量
        const autoTrackModule = await import('./autoTrack.js');

        const autoTrack = autoTrackModule.default || autoTrackModule; // 支持默认导出和命名导出
        const { appKey, apiUrl, encryptMode } = await loadTrackConfig();

        if (!window.QDTracker) {
            throw new Error('QDTracker script failed to load.');
        }
        // 初始化
        const qdtracker = window.QDTracker.init({
            appkey: appKey, //域名对应的appkey
            options: {
                appid: 'xxxxxx_appid', //使用Openid上报时，获取openid的公众号appid
                openid: 'xxxxxx_openid', //openid,
                singlePage: true, // 开启后会捕获单页应用的路由变化进而进行页面级行为上报
                encrypt_mode: encryptMode, // default - base64加密 ｜ close - 不加密 ｜ aes - aes加密 （依赖额外aes加密包，需要优先加载。方法如下方备注）
                enable_compression: false, // 上报前压缩
                track_interval: 0, // 发送间隔超时时间(ms)  - 如需开启批量发送，即batch_max_time > 1时，发送间隔超时时间需要设置为大于0的值。
                batch_max_time: 1, // 批量上报合并

                // ATTENTION：具体设置域名以实际情况为准
                // SaaS版本：请联系项目交付同事提供上报域名。
                // 私有化版本：请联系项目交付同事提供上报域名。
                url: apiUrl, // 上报地址

                // 全埋点配置初始化
                // 1. 页面全埋点
                preventAutoTrack: false, // 用于控制页面浏览事件（$pageview）和页面关闭事件（$pageclose）是否自动上报；false表示自动上报，true表示阻止自动上报，默认为false
                pagestay: false, // 用于控制页面停留事件（$pageview）是否自动上报；ture表示进行上报，false表示阻止自动上报，默认false

                // 2. 点击全埋点（v6.2新增）
                heatmap: {
                    clickmap: 'not_collect', // 用于控制元素点击事件（$WebClick）是否自动上报；default 表示自动上报，'not_collect'表示阻止自动上报，默认为'not_collect'
                    // 以下为配置默认采集点击事件的节点
                    collect_tags: {
                        DIV: {
                            max_level: 1 // 默认是 1，即只支持叶子 div。可配置范围是 [1, 2, 3]，非该范围配置值，会被当作 1 处理。
                        },
                        LI: true,
                        IMG: true,
                        SPAN: {
                            max_level: 1
                        }
                    },
                    // 手动在节点上，对需要进行点击采集的节点进行打标签采集点击          // 例子：<el-button anotherprop>anotherprop</el-button>
                    track_attr: ['hotrep', 'anotherprop', 'data-prop2'],

                    // 自定义标签属性，配置后，元素被点击时会收集标签上对应已配置的属性值，如：<a qd_tag_prop="qidian-test">
                    // 此处注册的为标签属性，全局属性不用在此注册
                    tag_attr: ['qdtagprop', 'qdtagprop1', 'qdtagprop2'],

                    // 内嵌iframe内部的节点，是否需要收集点击事件
                    iframeEnable: false // false表示不开启，true表示开启，默认为false；没有特殊要求建议不开启，以提高性能
                }
            }
        });
        // 设置 AES 加密方法
        qdtracker.setAes(window['__qq_qidian_da_market_AES_method']);
        // 启用自动跟踪插件
        QDTracker.use(autoTrack);

        return qdtracker;
    } catch (error) {
        console.error('===Tracking initialization failed===', error.message);
    }
}

export async function registerInitTrack() {
    try {
        initTracking().then(qdtracker => {
            if (qdtracker) {
                console.log('===Tracking initialization successfully===');
                window.QDTracker = qdtracker; // 挂载全局属性
                const memberId = storage.getItem('member_id');
                trackCommonDataMemberId(memberId);
            }
        });
    } catch (error) {
        console.error('===Tracking initialization failed===', error);
    }
}
