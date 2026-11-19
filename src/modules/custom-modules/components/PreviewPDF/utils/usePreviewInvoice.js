const userAgent = navigator.userAgent;
export const isIOSMobile = /iPhone|iPad|iPod|iOS/.test(userAgent);

// pc/h5下载文件
export const downloadPcMobileFile = (data) => {
    const { blob, linkUrl, filename, type = '' } = data
    const a = document.createElement('a');
    a.style.display = 'none';
    a.download = filename;
    let url;
    if (type !== 'mobile') {
        url = URL.createObjectURL(blob);
        a.href = url;
    } else {
        a.href = linkUrl;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 释放URL（仅非mobile类型）
    if (type !== 'mobile') {
        URL.revokeObjectURL(url);
    }
};

// 处理pc/h5下载
export const downloadPdfFile = async (data) => {
    const { linkUrl, filename } = data
    const isMobile = isMobileDevice();
    if (isMobile) {
        try {
            if (isIOSMobile) {
                window.location = linkUrl;
            } else {
                downloadPcMobileFile({
                    linkUrl, filename, type: 'mobile'
                })
            }
        } catch (error) {
            window.open(linkUrl);
        }
    } else {
        const response = await fetch(linkUrl);
        const blob = await response.blob(); // 转换为Blob对象
        downloadPcMobileFile({ blob, filename })
    }
}

// 获取pdf文件名
export const getPdfFileName = (url) => {
    const match = url.match(/([^/]+)(?=\.pdf$)/);
    if (match) {
        return match[1];  // 返回去掉.pdf后缀的文件名
    }
    return Date.now().toString();
}

// 是否移动设备
export const isMobileDevice = () => {
    const ua = navigator.userAgent?.toLowerCase?.() || '';
    const isMobileUA =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone|mobile/i
            .test(ua);
    // iPadOS 13+ 特殊处理
    const isIPadOS =
        ua.includes('macintosh') && navigator.maxTouchPoints > 1;

    return isMobileUA || isIPadOS;
};

export const downloadAppPdfFile = async data => {
    const { linkUrl } = data;
    try {
        window.ReactNativeWebView.postMessage(
            JSON.stringify({
                type: 'DOWNLOAD_PDF',
                url: linkUrl
            })
        );
    } catch (error) {
        console.error('下载失败：', error);
    }
};
