// 轨迹点详情点击
export const trackPointsDetailClick = params => {
    if (window?.QDTracker?.track) {
        const { channelType = '', signedPoint = '' } = params || {};
        window.QDTracker.track('points_detail_click', {
            point: `${channelType || ''} ${signedPoint || ''}`
        });
    }
};
