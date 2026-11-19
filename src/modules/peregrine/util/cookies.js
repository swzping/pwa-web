import Cookies from 'js-cookie';

const COOKIE_DEFAULT_EXPIRED = 365;

const COOKIE_DEFAULT_NAME = 'spwa-std';

export const getCookies = (key) => {
    const unparsedData = Cookies.get(COOKIE_DEFAULT_NAME);
    const data = unparsedData ? JSON.parse(unparsedData) : {};
    if (data && typeof data[key] !== 'undefined') {
        return data[key];
    }
    return '';
};

export const getCookiesFromRequest = (ctx, key) => {
    const {
        req,
    } = ctx;
    const data = req.cookies;
    return data[COOKIE_DEFAULT_NAME][key];
};

export const setCookies = (key, data) => {
    const unparsedOldData = Cookies.get(COOKIE_DEFAULT_NAME);
    const oldData = unparsedOldData ? JSON.parse(unparsedOldData) : {};
    Cookies.set(
        COOKIE_DEFAULT_NAME, 
        JSON.stringify({ ...oldData, [key]: data }), 
        { expires: COOKIE_DEFAULT_EXPIRED }
    );
    return true;
};

export const removeCookies = (key) => {
    const unparsedData = Cookies.get(COOKIE_DEFAULT_NAME);
    const data = unparsedData ? JSON.parse(unparsedData) : {};

    if(data[key]) delete data[key];

    Cookies.set(
        COOKIE_DEFAULT_NAME, 
        JSON.stringify({ ...data }), 
        { expires: COOKIE_DEFAULT_EXPIRED }
    );
    return true;
};

const set = (key, value) => {
    const maxChar = 1000;
    const str = JSON.stringify(value);
    if (str && (str.length > maxChar)) {
        let subKeys = '';
        for (let i = 0; i < str.length; i += maxChar) {
            Cookies.set(`__${key}_${i}`, str.slice(i, i + maxChar), { expires: COOKIE_DEFAULT_EXPIRED });
            subKeys += i + maxChar >= str.length ? i : `${i},`;
            if (i + maxChar >= str.length) {
                Cookies.set(`__${key}_subKeys`, JSON.stringify(subKeys), { expires: COOKIE_DEFAULT_EXPIRED });
            }
        }
    } else {
        Cookies.set(key, str, { expires: COOKIE_DEFAULT_EXPIRED });
    }
};

const get = (key) => {
    try {
        const subKeys = JSON.parse(Cookies.get(`__${key}_subKeys`));
        if (subKeys) {
            const str = subKeys.split(',').reduce((result, subKey) => result + JSON.parse(Cookies.get(`__${key}_${subKey}`)), '');
            return JSON.parse(str || null);
        }
        return JSON.parse(Cookies.get(key) || null);
    } catch (error) {
        return {};
    }
};

const remove = (key) => {
    const subKeys = JSON.parse(Cookies.get(`__${key}_subKeys`));
    if (subKeys) {
        subKeys.split(',').forEach((subKey) => Cookies.remove(`__${key}_${subKey}`));
        Cookies.remove(`__${key}_subKeys`);
        Cookies.remove(key);
    } else {
        Cookies.remove(key);
    }
};

export default {
    set, 
    get, 
    remove, 
    setCookies, 
    getCookies,
};
