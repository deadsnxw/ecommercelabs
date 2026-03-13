import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import "../../styles/LiveStream.css";

const STREAM_BASE =
  process.env.REACT_APP_STREAM_URL || "http://localhost:8081/hls";

/**
 * Embeddable live-stream player for use on profile / home pages.
 *
 * Props:
 *   streamKey — the user's stream key (used to build HLS URL)
 *   nickname  — channel name shown above the player
 *   compact   — if true render a smaller card variant (for homepage grid)
 */
export default function LiveStreamPlayer({ streamKey, nickname, compact = false }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);

  const url = `${STREAM_BASE}/${streamKey}.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({ liveDurationInfinity: true });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            hls.destroy();
            setError(true);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  if (error) return null;

  return (
    <div className={`ls-player ${compact ? "ls-player--compact" : ""}`}>
      <div className="ls-player__header">
        <span className="ls-player__badge">LIVE</span>
        {nickname && <span className="ls-player__nickname">{nickname}</span>}
      </div>
      <div className="ls-player__video-wrap">
        <video
          ref={videoRef}
          className="ls-player__video"
          controls
          autoPlay
          muted
          playsInline
        />
      </div>
    </div>
  );
}
