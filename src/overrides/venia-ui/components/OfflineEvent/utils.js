import { BrowserPersistence } from '@magento/peregrine/lib/util';

const storage = new BrowserPersistence();
export const getStorageMemberId = () => storage.getItem('member_id');

// 添加url参数
export const buildLink = (link, params = {}) => {
    try {
        const url = new URL(link);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
        return url.toString();
    } catch (e) {
        console.error('[buildLink]', e);
        return link;
    }
};
