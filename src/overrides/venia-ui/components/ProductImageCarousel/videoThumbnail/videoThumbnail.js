import React, { useState, useEffect } from 'react';
import { ReactYTFlexible } from 'react-yt-flexible';
import { isYoutubeUrl, youtubeRegExp, getYoutubeId } from '../../../util/youtubeUtil';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { VideoFilled } from '@/assets/icons';

import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './videoThumbnail.module.css';
import SimpleVideoThumbnail from './simpleVideoThumbnail';

const VideoThumbnail = props => {
    const { videoUrl } = props;
    const classes = useStyle(defaultClasses, props.classes);
    const isYoutube = isYoutubeUrl(videoUrl);
    // const [isYoutubeLoading, setIsYoutubeLoading] = useState(true);
    // const [isSimpleVideoLoading, setIsSimpleVideoLoading] = useState(true);

    // useEffect(() => {
    //     if (isYoutube) {
    //         // 给 YouTube 缩略图加载一个合理的延时
    //         const timer = setTimeout(() => {
    //             setIsYoutubeLoading(false);
    //         }, 500);
    //         return () => clearTimeout(timer);
    //     }
    // }, [isYoutube, videoUrl]);

    // useEffect(() => {
    //     if (!isYoutube) {
    //         // 给普通视频缩略图加载一个合理的延时
    //         const timer = setTimeout(() => {
    //             setIsSimpleVideoLoading(false);
    //         }, 500);
    //         return () => clearTimeout(timer);
    //     }
    // }, [isYoutube, videoUrl]);

    return isYoutube ? (
        <div className={classes.videoThumbnailWrapper}>
            <Icon src={VideoFilled} size={50} className={classes.videoIcon} />
            <ReactYTFlexible
                videoId={getYoutubeId(videoUrl)}
                mode="thumbnail"
                style={{ height: '100%'}}
            />
            {/* {isYoutubeLoading && (
                <div className={classes.loadingSpinner}>
                    <span className={classes.spinner} />
                </div>
            )} */}
        </div>
    ) : (
        <div className={classes.videoThumbnailWrapper}>
            <div
                style={{ width: '100%', height: '100%', position: 'relative' }}
            >
                <Icon
                    src={VideoFilled}
                    size={50}
                    className={classes.videoIcon}
                />
                <SimpleVideoThumbnail
                    videoUrl={videoUrl}
                    width={62}
                    height={62}
                />
                {/* {isSimpleVideoLoading && (
                    <div className={classes.loadingSpinner}>
                        <span className={classes.spinner} />
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default VideoThumbnail;
