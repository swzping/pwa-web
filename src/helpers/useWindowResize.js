import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

/**
 * 监听窗口大小变化，判断是否为移动端（窗口宽度 < 750px）
 * @param {number} deviceSize 移动端断点宽度，默认 750px
 * @param {number} delay 防抖延迟时间，默认 250ms
 * @returns {boolean} 是否为移动端
 */
export const useWindowResize = (
    {
        deviceSize = 750,
        delay = 250
    }) => {
    const [isMobile, setIsMobile] = useState(() => {
        // 仅在浏览器环境中访问 window，服务端返回 false（或按需调整）
        if (typeof window === 'undefined') return false;
        return window.innerWidth < deviceSize;
    });

    useEffect(() => {
        const handleResize = debounce(() => {
            if (typeof window === 'undefined') return;
            setIsMobile(window.innerWidth < deviceSize);
        }, delay);

        window.addEventListener('resize', handleResize);
        // 清理函数不仅移除事件监听，还取消未执行的防抖回调
        return () => {
            window.removeEventListener('resize', handleResize);
            handleResize.cancel();
        };
    }, [deviceSize, delay]); // 补充依赖，符合Hook规范

    return isMobile;
};
