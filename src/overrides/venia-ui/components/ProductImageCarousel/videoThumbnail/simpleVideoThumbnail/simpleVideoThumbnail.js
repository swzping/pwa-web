import React, { useRef, useEffect } from 'react';

const SimpleVideoThumbnail = ({ videoUrl, width, height }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const drawThumbnail = () => {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.clientWidth; // canvas 等于video 长宽，video 不能设置为hidden 不然取不到长宽
            canvasRef.current.height = videoRef.current.clientHeight;
            ctx.drawImage(videoRef.current, 0, 0, videoRef.current.clientWidth, videoRef.current.clientHeight);
        };

        const loadVideo = () => {
            const video = videoRef.current;
            video.src = videoUrl;
            video.crossOrigin = 'anonymous'; // 如果跨域，需要设置该属性
            video.currentTime = 1;
            video.onloadeddata = drawThumbnail;
            video.onerror = () => {
                console.error('Error loading video or drawing thumbnail');
            };
        };

        loadVideo();
    }, [videoUrl, width, height]);

    return (
        <div style={{ aspectRatio: 1, position: 'relative', maxHeight: height + 'px' }}>
            <canvas ref={canvasRef} />
            <video ref={videoRef} preload="metadata" style={{ visibility: 'hidden', position: 'absolute', top: 0 }} />
            {/* <video ref={videoRef} preload="metadata" /> */}
        </div>
    );
};

export default SimpleVideoThumbnail;
