import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Toast 状态管理 Hook
 *
 * @param {object} options - 配置选项
 * @param {number} options.autoCloseDelay - 自动关闭延迟时间（毫秒），默认 3000，设为 0 或 false 则不自动关闭
 * @returns {object} - { toastState, showToast, hideToast, clearToast }
 */
const useToastState = (options = {}) => {
    const { autoCloseDelay = 2000 } = options;
    const [toastState, setToastState] = useState(null);
    const timeoutRef = useRef(null);

    // 清理定时器
    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // 显示 Toast
    const showToast = useCallback((type, message, customDelay) => {
        // 清除之前的定时器
        clearTimer();

        // 设置新的 toast 状态
        setToastState({
            type: type || 'info',
            message: message || ''
        });

        // 如果设置了自动关闭延迟，则设置定时器
        const delay = customDelay !== undefined ? customDelay : autoCloseDelay;
        if (delay && delay > 0) {
            timeoutRef.current = setTimeout(() => {
                setToastState(null);
                timeoutRef.current = null;
            }, delay);
        }
    }, [autoCloseDelay, clearTimer]);

    // 手动关闭 Toast
    const hideToast = useCallback(() => {
        clearTimer();
        setToastState(null);
    }, [clearTimer]);

    // 清除 Toast（别名，与 hideToast 相同）
    const clearToast = useCallback(() => {
        hideToast();
    }, [hideToast]);

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            clearTimer();
        };
    }, [clearTimer]);

    return {
        toastState,
        showToast,
        hideToast,
        clearToast,
        // 便捷方法
        showError: useCallback((message, delay) => showToast('error', message, delay), [showToast]),
        showSuccess: useCallback((message, delay) => showToast('success', message, delay), [showToast]),
        showInfo: useCallback((message, delay) => showToast('info', message, delay), [showToast]),
        showWarning: useCallback((message, delay) => showToast('warning', message, delay), [showToast])
    };
};

export default useToastState;

