import React, { useState, useRef, useEffect, useMemo } from 'react';
import defaultClasses from './videoPlayer.module.css';
import { useStyle } from '@magento/venia-ui/lib/classify';
import YouTube from 'react-youtube';
import { isYoutubeUrl, getYoutubeId } from '../../../util/youtubeUtil';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { Video1 } from '@/assets/icons';
import { Remark } from '../../ProductImageCarousel/remark'
import DiscountRibbon from '../../../../../modules/swift-pwa-ui/components/DiscountRibbon';
// import Icon from '@magento/venia-ui/lib/components/Icon';
// import { Volume, Volume1 } from '@/assets/icons';
// import Button from '@magento/venia-ui/lib/components/Button';
// import { useWishlistItem } from '@magento/peregrine/lib/talons/WishlistPage/useWishlistItem';

const VideoPlayer = props => {
    const { is_flash_sale, discount_percentage, stock_status, src, onClick, classes: propClasses } = props;
    // app ProductDetail parity — discount ribbon beside the flash badge
    const showDiscountRibbon = Number(discount_percentage) > 0;
    const classes = useStyle(defaultClasses, { propClasses });
    const [youtubeId, setYoutubeId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const volumeSliderRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

    const isYoutube = isYoutubeUrl(src);
    let isMobile = '';
    window.innerWidth <= 767 ? (isMobile = true) : (isMobile = false);

    // const talonProps = useWishlistItem({item: {}, onOpenAddToCartDialog: () => {}, wishlistId: 1});
    // const {
    //     addToCartButtonProps,
    //     handleRemoveProductFromWishlist,
    //     hasError,
    //     isRemovalInProgress,
    //     isSupportedProductType
    // } = talonProps;

    // 处理视频时间更新
    useEffect(() => {
        const video = videoRef.current;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('ended', handleEnded);
        }

        return () => {
            if (video) {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener(
                    'loadedmetadata',
                    handleLoadedMetadata
                );
                video.removeEventListener('ended', handleEnded);
            }
        };
    }, []);

    // 切换全屏
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current.msRequestFullscreen) {
                containerRef.current.msRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    // 播放/暂停切换
    const togglePlayPause = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // 静音切换
    const toggleMute = () => {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    // 设置音量
    const handleVolumeChange = e => {
        const rect = volumeSliderRef?.current?.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const _nolume = Math.max(0, Math.min(1, percent));
        const newVolume = parseFloat(_nolume);
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        if (newVolume === 0) {
            setIsMuted(true);
            videoRef.current.muted = true;
        } else if (isMuted) {
            setIsMuted(false);
            videoRef.current.muted = false;
        }
    };

    // 音量滑块样式
    const volumeSliderStyle = {
        width: '40px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        cursor: 'pointer',
        marginLeft: '10px'
    };

    // 音量级别样式
    const volumeLevelStyle = {
        height: '100%',
        background: '#ff4757',
        borderRadius: '2px',
        width: `${isMuted ? 0 : volume * 100}%`
    };

    // 进度条容器样式
    const progressContainerStyle = {
        width: '40%',
        height: '6px',
        background: 'rgba(158, 158, 158, 1)',
        borderRadius: '3px',
        cursor: 'pointer',
        position: 'relative'
    };

    // 进度条样式
    const progressBarStyle = {
        height: '100%',
        background: 'rgba(255, 130, 0, 1)',
        borderRadius: '3px',
        width: currentTime != 0 ? `${(currentTime / duration) * 100}%` : 0,
        position: 'relative'
    };

    // 格式化时间显示
    const formatTime = seconds => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec
            .toString()
            .padStart(2, '0')}`;
    };

    // 时间显示样式
    const timeDisplayStyle = {
        fontSize: '11px',
        color: '#fff',
        width: '40px',
        textAlign: 'center'
    };

    // 设置播放进度
    const handleProgressChange = e => {
        const rect = e.target.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        setCurrentTime(newTime);
        videoRef.current.currentTime = newTime;
    };

    useEffect(() => {
        setIsLoading(true);
        if (isYoutube) {
            setYoutubeId(getYoutubeId(src));
        }
        videoRef.current.pause();
        setIsPlaying(false);
    }, [src, isYoutube]);

    const opts = {
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 0
        }
    };

    const handleReady = () => {
        setIsLoading(false);
    };

    return useMemo(() => {
        return (
            <div className={classes.videoPlayerWrapper} onClick={onClick}>
                {/* {isLoading && (
                    <div className={classes.loadingSpinner}>
                        <span className={classes.spinner} />
                    </div>
                )} */}
                {isYoutube ? (
                    <YouTube
                        videoId={youtubeId}
                        opts={opts}
                        className={classes.videoPlayerWrapper}
                        iframeClassName={classes.youtube}
                        onReady={handleReady}
                    />
                ) : (
                    <div ref={containerRef} style={{ position: 'relative' }}>
                        { !isLoading && videoRef.current?.paused && <Icon
                            src={Video1}
                            size={80}
                            className={classes.videoIcon}
                            onClick={togglePlayPause}
                        />}
                        {(is_flash_sale === 1 || showDiscountRibbon) && (
                            <div style={{ position: 'absolute', top: 15, left: 20, margin: 0, zIndex: 99, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                                {is_flash_sale === 1 && <img style={{ margin: 0, borderRadius: 0, width: 67 }} src='/venia-static-assets/images/flashProduct.png' alt="" />}
                                {showDiscountRibbon && <DiscountRibbon percent={discount_percentage} width={67} />}
                            </div>
                        )}
                        <video
                            src={src}
                            controls
                            width="100%"
                            height="100%"
                            ref={videoRef}
                            className={classes.video}
                            // onClick={togglePlayPause}
                            onLoadedData={handleReady}
                            onLoadStart={() =>
                                console.log('Video load started')
                            }
                            onError={e => {
                                console.error('Video load error:', e);
                                handleReady();
                            }}
                        />
                        { stock_status === "OUT_OF_STOCK"  && <div className={classes.outOfStock}>Out of Stock</div>}
                        { stock_status == "OUT_OF_STOCK" && <Remark />}
                        {/* <div className={classes.customControls}>
                            <div className={classes.customControlsLeft}>
                                <div onClick={togglePlayPause}>
                                    {isPlaying ? '⏸' : '▶'}
                                </div>
                                <span style={timeDisplayStyle}>
                                    {formatTime(currentTime)}
                                </span>
                                <div
                                    style={progressContainerStyle}
                                    onClick={handleProgressChange}
                                >
                                    <div style={progressBarStyle} />
                                </div>
                                <span style={timeDisplayStyle}>
                                    {formatTime(duration)}
                                </span>
                            </div>
                            <div className={classes.customControlsRight}>
                                {<Icon onClick={toggleMute} src={isMuted || volume == 0 ? Volume1 : Volume} size={30} />}
                                <div
                                    style={volumeSliderStyle}
                                    ref={volumeSliderRef}
                                    onClick={handleVolumeChange}
                                >
                                    <div style={volumeLevelStyle} />
                                </div>
                                <div
                                    className={classes.controlBtn}
                                    onClick={toggleFullscreen}
                                >
                                    {!isFullscreen ? '⛶' : '⛶'}
                                </div>
                            </div>
                            {isMobile && isFullscreen && (
                                <Button className={classes.wishList}>
                                    Add to wishlist
                                </Button>
                            )}
                        </div> */}
                    </div>
                )}
            </div>
        );
    }, [youtubeId, src, isYoutube, onClick, classes, isLoading, opts, is_flash_sale, discount_percentage, stock_status, showDiscountRibbon]);
};

export default VideoPlayer;
