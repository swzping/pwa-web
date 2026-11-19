import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { useHistory } from 'react-router-dom';
import { ChevronLeft } from 'react-feather';
import { debounce } from 'lodash';
import { DownLoadSvg } from '@/assets/icons';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import RenderErrorView from './renderErrorView/renderErrorView';
import NoNetwork from '@/modules/custom-modules/components/NoNetwork/noNetwork';
import { loadPdfRuntime, workerUrl } from './pdfRuntime';
import usePinchZoomPan from './utils/usePinchZoomPan';
import { useNetworkStatus } from '@/helpers/useNetworkStatus';
import { useWindowResize } from '@/helpers/useWindowResize';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import {
    downloadPdfFile,
    getPdfFileName,
    downloadAppPdfFile
} from './utils/usePreviewInvoice';

import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import defaultClasses from './previewInvoice.module.css';

const PreviewInvoice = props => {
    const { classes: propClasses } = props;
    const classes = useStyle(defaultClasses, propClasses);
    const [{ isSignedIn }] = useUserContext();
    const isOnline = useNetworkStatus();
    const history = useHistory();
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [isRenderError, setIsRenderError] = useState(false);
    const [pdfStatus, setPdfStatus] = useState('loading');
    const isMobile = useWindowResize({ delay: 500 });
    const userScale = isMobile ? 'PageWidth' : 1.3;
    const searchParams = new URLSearchParams(location.search);
    const queryId = searchParams.get('invoiceUrl');
    const querySource = searchParams.get('source');
    const isApp = querySource === 'APP';

    useEffect(() => {
        if (!isOnline) return;
        let active = true;
        setPdfStatus(status => status === 'ready' ? status : 'loading');
        loadPdfRuntime().then(
            () => active && setPdfStatus('ready'),
            () => active && setPdfStatus('error')
        );
        return () => { active = false; };
    }, [isOnline]);

    const { containerRef, onTouchStart, onTouchMove } = usePinchZoomPan({
        minScale: 1,
        maxScale: 2.2,
        moveSpeed: 1,
        zoomSpeed: 0.005
    });

    useEffect(() => {
        if (queryId) {
            setPdfUrl(queryId);
        }
    }, [queryId]);

    useEffect(() => {
        if (!isSignedIn && !isApp) {
            history.push('/sign-in');
        }
    }, [isSignedIn]);

    // PC端定制工具栏
    const pcLayoutPluginInstance = defaultLayoutPlugin({
        // 设置初始标签页  0 = 缩略图, 1 = 书签, 2 = 附件
        setInitialTab: async doc => {
            return 0; // 默认打开缩略图
        },
        // 自定义侧边栏标签
        sidebarTabs: defaultTabs => [
            defaultTabs[0] // 缩略图标签
        ]
    });

    // 移动端隐藏工具栏
    const plugins = useMemo(() => {
        return !isMobile ? [pcLayoutPluginInstance] : [];
    }, [isMobile]);

    // 下载
    const handleDownLoad = debounce(pdfUrl => {
        handleDownLoadPdf(pdfUrl);
    }, 500);

    // App端下载
    const handleAppDownLoad = debounce(pdfUrl => {
        handleDownLoadPdf(pdfUrl);
    }, 500);

    // 处理下载
    const handleDownLoadPdf = async (linkUrl = '') => {
        if (!linkUrl) return;
        setDownloadLoading(true);
        const filename = getPdfFileName(linkUrl); // 获取文件名
        try {
            if (isApp) {
                downloadAppPdfFile({ linkUrl, filename });
            } else {
                downloadPdfFile({ linkUrl, filename });
            }
        } catch (err) {
            console.error('文件处理失败:', err);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleGoHome = () => {
        history.push('/');
    };

    const handleTouchStart = (e) => {
        if (isRenderError) return;
        onTouchStart(e);
    };
    const handleTouchMove = (e) => {
        if (isRenderError) return;
        onTouchMove(e);
    };

    return (
        <div className={classes.root}>
            {isMobile && !isApp ? (
                <div className={classes.headerWrapper}>
                    <button
                        className={classes.backButton}
                        onClick={() => history.goBack()}
                    >
                        <ChevronLeft />
                    </button>
                    <div className={classes.title}>Receipt</div>
                    {isOnline && !isRenderError ? (
                        <span
                            className={classes.downLoadSvg}
                            onClick={() => handleDownLoad(pdfUrl)}
                        >
                            <DownLoadSvg
                                style={{ fontSize: '16px', color: '#212529' }}
                            />
                        </span>
                    ) : null}
                </div>
            ) : null}
            {isOnline ? (
                <div className={classes.contentViewport}>
                    <div
                        ref={containerRef}
                        className={classes.container}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        style={{
                            height:
                                isMobile && !isApp
                                    ? 'calc(100% - 40px)'
                                    : '100%',
                            marginTop: isMobile && !isApp ? '40px' : '',
                            paddingTop: isApp ? '10px' : ''
                        }}
                    >
                        {pdfStatus === 'loading' ? fullPageLoadingIndicator : pdfStatus === 'ready' && pdfUrl ? (
                            <>
                                <Worker workerUrl={workerUrl}>
                                    <Viewer
                                        key={userScale}
                                        fileUrl={pdfUrl}
                                        plugins={plugins}
                                        defaultScale={userScale}
                                        renderError={() => {
                                            setIsRenderError(true);
                                            return (
                                                <RenderErrorView
                                                    showHomeButton={!isApp}
                                                    returnHomePage={
                                                        handleGoHome
                                                    }
                                                />
                                            );
                                        }}
                                    />
                                    {downloadLoading &&
                                        fullPageLoadingIndicator}
                                </Worker>
                            </>
                        ) : (
                            <RenderErrorView
                                showHomeButton={!isApp}
                                returnHomePage={handleGoHome}
                            />
                        )}
                    </div>
                    {isApp && !isRenderError ? (
                        <span
                            className={classes.downLoadApp}
                            onClick={() => handleAppDownLoad(pdfUrl)}
                        >
                            <DownLoadSvg
                                style={{ fontSize: '16px', color: '#212529' }}
                            />
                        </span>
                    ) : null}
                </div>
            ) : (
                <NoNetwork
                    content="No internet connection. Please check your network and try
                    again."
                />
            )}
        </div>
    );
};

PreviewInvoice.propTypes = {
    classes: PropTypes.shape({
        root: PropTypes.string,
        container: PropTypes.string
    })
};

export default PreviewInvoice;
