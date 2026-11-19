import { useEffect, useState } from 'react';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { Util } from '@magento/peregrine/lib/index';

const { BrowserPersistence } = Util;
const storage = new BrowserPersistence();

const MEMBER_ID_STORAGE_KEY = 'guidMemberSymbol';

const INVALID_IDS = new Set(['', 'null', 'undefined']);

const hashCode = str => {
    let hash = 0;
    if (!str || str.length === 0) {
        return hash;
    }
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash;
};

const generateClientId = () => {
    const clientInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return `client_${Math.abs(hashCode(JSON.stringify(clientInfo)))}`;
};

const getCookie = name => {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts
                .pop()
                .split(';')
                .shift();
        }
        return null;
    } catch (error) {
        return null;
    }
};

const normalizeId = value => {
    const id = (value != null ? value : '').toString().trim();
    return INVALID_IDS.has(id) ? '' : id;
};

const getGuidMemberSymbol = () => {
    try {
        return normalizeId(sessionStorage.getItem(MEMBER_ID_STORAGE_KEY));
    } catch (error) {
        return '';
    }
};

const getPersistedMemberId = () => normalizeId(storage.getItem('member_id'));

const getSignedInCliUbid = () => {
    const guidSymbol = getGuidMemberSymbol();
    if (guidSymbol) {
        return guidSymbol;
    }

    const memberId = getPersistedMemberId();
    if (memberId) {
        return memberId;
    }

    return '';
};

/**
 * Osmos cliUbid：已登录优先 guidMemberSymbol，其次 localStorage member_id；未登录用 cookie token 或匿名 client id
 * @param {{ isSignedIn?: boolean }} options
 */
export const getUserIdentifier = ({ isSignedIn = false } = {}) => {
    if (isSignedIn) {
        const signedInId = getSignedInCliUbid();
        if (signedInId) {
            return signedInId;
        }
    }

    const cookieClid = normalizeId(getCookie('token'));
    if (cookieClid) {
        return cookieClid;
    }

    return generateClientId();
};

/** 登录后等待 guidMemberSymbol / member_id 写入后再刷新 cliUbid */
export const useCliUbid = () => {
    const [{ isSignedIn }] = useUserContext();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!isSignedIn || getSignedInCliUbid()) {
            return undefined;
        }

        const timer = setInterval(() => {
            if (getSignedInCliUbid()) {
                setRefreshKey(key => key + 1);
            }
        }, 500);

        const timeout = setTimeout(() => {
            clearInterval(timer);
        }, 10000);

        return () => {
            clearInterval(timer);
            clearTimeout(timeout);
        };
    }, [isSignedIn]);

    void refreshKey;

    return getUserIdentifier({ isSignedIn });
};
