import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Toast from './toast';

/**
 * 全局单例 Toast Portal + Hook
 *
 * 用法：
 *   const { showToast, showSuccess, showError, hideToast } = useToast();
 *   showSuccess('Saved!');
 *
 * 该 hook 不需要在 JSX 中挂载任何组件，首次调用会在 document.body 上创建一个 portal。
 */

// 管理员引用（单例）
let manager = null;

function ensureManager() {
    if (manager) return manager;

    // container DOM
    const container = document.createElement('div');
    container.setAttribute('data-toast-portal', 'true');
    document.body.appendChild(container);

    // 内部状态由此组件维护
    const ManagerComponent = () => {
        const [state, setState] = useState(null); // { type, message }
        const [visible, setVisible] = useState(false);

        useEffect(() => {
            // 暴露控制函数
            manager = {
                show: (type, message) => {
                    setState({ type, message });
                    setVisible(true);
                },
                hide: () => {
                    setVisible(false);
                    // 等动画/淡出需求可以在这里处理
                    setTimeout(() => setState(null), 500);
                },
                getState: () => ({ state, visible })
            };
            return () => {
                manager = null;
            };
        }, []);

        return (
            state && (
                <div>
                    <Toast visible={visible} type={state.type} message={state.message} />
                </div>
            )
        );
    };

    ReactDOM.render(<ManagerComponent />, container);
    return manager;
}

export default function useToast() {
    // ensure manager mounted once
    useEffect(() => {
        ensureManager();
        // 不卸载 manager，以便页面周期内复用
    }, []);

    // 定时器单例（页面级）
    const timerRef = { current: null };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const showToast = (type, message, delay = 2000) => {
        const m = ensureManager();
        if (!m) return;
        scrollToTop()
        m.show(type, message);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (delay && delay > 0) {
            timerRef.current = setTimeout(() => {
                m.hide();
                timerRef.current = null;
            }, delay);
        }
    };

    const hideToast = () => {
        const m = ensureManager();
        if (!m) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        m.hide();
    };

    return {
        showToast,
        hideToast,
        showError: (msg, d) => showToast('error', msg, d),
        showSuccess: (msg, d) => showToast('success', msg, d),
        showInfo: (msg, d) => showToast('info', msg, d),
        showWarning: (msg, d) => showToast('warning', msg, d)
    };
}

useToast.propTypes = {};
