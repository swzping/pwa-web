import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import alertCircleIcon from '../../../../../../venia-static-assets/images/alert_circle_icon.png'
import infoCircleIcon from '../../../../../../venia-static-assets/images/info_circle_icon.png'
import checkCircleIcon from '../../../../../../venia-static-assets/images/check_circle_icon.png'

// Toast 容器样式
const toastWrapperStyle = {
    position: 'absolute',
    top: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'auto'
};

// Toast 基础样式
const toastBaseStyle = {
    minWidth: 343,
    maxWidth: 480,
    padding: 16,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#424242',
    boxShadow: '0px 4px 20px 0px #0000001F',
    gap: 8,
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    fontSize: 14,
    fontWeight: 500
};

// 不同类型 Toast 的背景色
const toastTypeStyleMap = {
    info: { background: '#424242', color: '#FFFFFF' },
    success: { background: ' #424242', color: '#FFFFFF' },
    warning: { background: '#424242', color: '#FFFFFF' },
    error: { background: '#FFFBFB', color: '#424242' }
};


// 图标圆圈样式
const toastIconCircleStyle = {
    width: 24,
    height: 24
};

// 消息文本样式
const toastMessageStyle = {
    flex: 1,
    fontWeight: 700,
    fontSize: 14,
};

// 图标映射
const iconMap = {
    info: infoCircleIcon,
    error: alertCircleIcon,
    success: checkCircleIcon,
    warning: infoCircleIcon
};

/**
 * Toast 提示组件
 *
 * @param {boolean} visible - 是否显示
 * @param {string} type - 类型: 'info' | 'error' | 'success' | 'warning'
 * @param {React.ReactNode} message - 提示消息（支持字符串/数字/React 节点，如 FormattedMessage）
 * @param {object} style - 自定义样式（可选）
 */
const Toast = ({ visible, type = 'info', message, style }) => {
    // message 允许传入 ReactNode；仅在 null/undefined 时视为“无消息”
    if (!visible || message === null || message === undefined) return null;
    const [isPhone, setIsPhone] = useState(window.innerWidth < 767);

    const resizePhone = () => {
        window.onresize = function () {
            const width = window.innerWidth;
            const newIsPhone = width < 767;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    const topPosition = isPhone ? 32 : 270;

    const imgSrc = iconMap[type] || iconMap.info;
    const contentStyle = toastTypeStyleMap[type] || {}
    const mergedStyle = {
        ...toastBaseStyle,
        ...contentStyle,
        ...style
    };




    return (
        <div style={{ ...toastWrapperStyle, top: topPosition }}>
            <div style={mergedStyle} role="status" aria-live="polite">
                <img style={toastIconCircleStyle} src={imgSrc} alt="" />
                <div style={toastMessageStyle}>{message}</div>
            </div>
        </div>
    );
};

Toast.propTypes = {
    visible: PropTypes.bool,
    type: PropTypes.oneOf(['info', 'error', 'success', 'warning']),
    message: PropTypes.node,
    style: PropTypes.object
};

export default Toast;

