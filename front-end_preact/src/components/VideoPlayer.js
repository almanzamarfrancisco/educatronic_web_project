import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

const VideoPlayer = ({ streamUrl }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
    //   videoRef.current.play().catch(e => console.error("Autoplay failed:", e));
    }
  }, [streamUrl]);

  return (
    <div className="mt-4 aspect-video bg-gray-200 flex items-center justify-center">
      <img 
        ref={videoRef}
        src={streamUrl} 
        alt="Video Stream" 
        style="transform: rotate(180deg); width: 100%; height: 100%; object-fit: cover;" 
        class="mx-auto rounded-lg"
      />
    </div>
  );
};

export default VideoPlayer;