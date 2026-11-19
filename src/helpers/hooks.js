import React, { useState, useEffect } from 'react'
export const useLocalStorageListener = key => {
    const [value, setValue] = useState(localStorage.getItem(key));
    useEffect(() => {
        // 1. 保存原生的 setItem 方法
        const originalSetItem = localStorage.setItem;

        // 2. 重写 setItem 方法
        localStorage.setItem = function(keyName, newValue) {
            // 创建一个自定义事件
            const event = new CustomEvent('localStorageCustomChange', {
                detail: { key: keyName, newValue }
            });
            // 先派发自定义事件
            window.dispatchEvent(event);
            // 再调用原生方法实际存储
            originalSetItem.apply(this, [keyName, newValue]);
        };

        // 3. 监听自定义事件
        const handleCustomChange = event => {
            if (event.detail.key === key) {
                setValue(event.detail.newValue);
            }
        };
        window.addEventListener('localStorageCustomChange', handleCustomChange);

        // 4. 清理：移除监听并恢复原生方法
        return () => {
            window.removeEventListener(
                'localStorageCustomChange',
                handleCustomChange
            );
            localStorage.setItem = originalSetItem;
        };
    }, [key]); // 依赖项：监听的键名

    return value;
};

/**
 * 发送通知刷新事件
 */
export const emitRefreshNotification = () => {
    window.dispatchEvent(new CustomEvent('refreshNotificationCount'));
};

/**
 * 监听通知刷新事件
 */
export const useRefreshNotification = callback => {
    useEffect(() => {
        if (!callback) {
            return;
        }
        const handler = async () => {
            await callback();
        };
        window.addEventListener('refreshNotificationCount', handler);
        return () => {
            window.removeEventListener('refreshNotificationCount', handler);
        };
    }, [callback]);
};

// 解析手机号码
export const parsePhoneNumber = phone => {
    const defaultCountryCode = '+62';

    try {
        if (!phone || typeof phone !== 'string') {
            return {
                countryCode: defaultCountryCode,
                phoneNumber: ''
            };
        }

        const value = phone.trim();
        // 印尼手机号专用规则
        if (value.startsWith('+62')) {
            const numberPart = value.slice(3); // 去掉 +62

            // 验证印尼手机号：必须 8 开头 + 长度 9-12位
            if (/^8[1-9]\d{7,10}$/.test(numberPart)) {
                return {
                    countryCode: '+62',
                    phoneNumber: numberPart
                };
            }
        }

        // 通用国际号码兜底
        const match = value.match(/^(\+\d{1,4})(\d+)$/);
        if (match) {
            return {
                countryCode: match[1],
                phoneNumber: match[2]
            };
        }

        // 最终兜底（保持印尼默认）
        return {
            countryCode: defaultCountryCode,
            phoneNumber: value.replace(/\D/g, '')
        };

    } catch (error) {
        console.error('parsePhoneNumber error:', error);
        return {
            countryCode: defaultCountryCode,
            phoneNumber: ''
        };
    }
};