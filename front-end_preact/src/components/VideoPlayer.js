import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ src }) => {
    const videoNode = useRef(null);
    
    useEffect(() => {
        if (videoNode.current) {
            const player = videojs(videoNode.current, {
                controls: true,
                autoplay: true,
                preload: 'auto',
                fluid: true,
                muted: true,
                sources: [{
                    src: src,
                    type: 'application/x-mpegURL'
                }]
            });
            
            return () => {
                if (player) {
                    player.dispose();
                }
            };
        }
    }, [src]);
    
    return (
        <div className="w-full aspect-video">
            <div data-vjs-player>
                <video ref={videoNode} className="video-js vjs-default-skin" />
            </div>
        </div>
    );
};

export default VideoPlayer;