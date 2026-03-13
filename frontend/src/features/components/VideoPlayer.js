import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../../styles/VideoPlayer.css';

/* ─── Formatters ──────────────────────────────────────────────────────────── */
const fmtTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

/* ─── SVG Icons ───────────────────────────────────────────────────────────── */
const IconPlay = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
    </svg>
);
const IconPause = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
);
const IconVolume = ({ muted, level }) => {
    if (muted || level === 0) return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
    );
    if (level < 0.5) return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
        </svg>
    );
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    );
};
const IconFullscreen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
);
const IconExitFullscreen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const VideoPlayer = ({
    src,
    title,
    onTimeUpdate,
    onEnded,
    autoPlay = false,
}) => {
    const videoRef     = useRef(null);
    const containerRef = useRef(null);
    const hideTimer    = useRef(null);

    const [playing,      setPlaying     ] = useState(false);
    const [currentTime,  setCurrentTime ] = useState(0);
    const [duration,     setDuration    ] = useState(0);
    const [buffered,     setBuffered    ] = useState(0);
    const [volume,       setVolume      ] = useState(1);
    const [muted,        setMuted       ] = useState(false);
    const [fullscreen,   setFullscreen  ] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [speed,        setSpeed       ] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    /* ── hide controls after inactivity ── */
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        clearTimeout(hideTimer.current);
        if (playing) {
            hideTimer.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [playing]);

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    useEffect(() => {
        if (!playing) {
            setShowControls(true);
            clearTimeout(hideTimer.current);
        }
    }, [playing]);

    /* ── video events ── */
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onPlay      = () => setPlaying(true);
        const onPause     = () => setPlaying(false);
        const onLoaded    = () => setDuration(v.duration || 0);
        const onTime      = () => {
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
            onTimeUpdate?.(v.currentTime);
        };
        const onEnd       = () => { setPlaying(false); onEnded?.(); };
        const onVolumeChg = () => { setVolume(v.volume); setMuted(v.muted); };

        v.addEventListener('play',           onPlay);
        v.addEventListener('pause',          onPause);
        v.addEventListener('loadedmetadata', onLoaded);
        v.addEventListener('timeupdate',     onTime);
        v.addEventListener('ended',          onEnd);
        v.addEventListener('volumechange',   onVolumeChg);

        return () => {
            v.removeEventListener('play',           onPlay);
            v.removeEventListener('pause',          onPause);
            v.removeEventListener('loadedmetadata', onLoaded);
            v.removeEventListener('timeupdate',     onTime);
            v.removeEventListener('ended',          onEnd);
            v.removeEventListener('volumechange',   onVolumeChg);
        };
    }, [src]);

    /* ── fullscreen change ── */
    useEffect(() => {
        const handler = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    /* ── keyboard shortcuts ── */
    useEffect(() => {
        const handler = (e) => {
            if (document.activeElement !== document.body &&
                !containerRef.current?.contains(document.activeElement)) return;
            if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') { seek(5); }
            if (e.code === 'ArrowLeft')  { seek(-5); }
            if (e.code === 'ArrowUp')    { changeVolume(0.1); }
            if (e.code === 'ArrowDown')  { changeVolume(-0.1); }
            if (e.code === 'KeyM')       { toggleMute(); }
            if (e.code === 'KeyF')       { toggleFullscreen(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [playing, volume, muted]);

    /* ── controls ── */
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        v.paused ? v.play() : v.pause();
        resetHideTimer();
    };

    const seek = (delta) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
        resetHideTimer();
    };

    const seekTo = (e) => {
        const v = videoRef.current;
        if (!v || !duration) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        v.currentTime = ratio * duration;
        resetHideTimer();
    };

    const changeVolume = (delta) => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = Math.max(0, Math.min(1, v.volume + delta));
        if (v.volume > 0) v.muted = false;
    };

    const setVolumeTo = (val) => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = val;
        v.muted  = val === 0;
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (v) v.muted = !v.muted;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    const setPlaybackSpeed = (s) => {
        const v = videoRef.current;
        if (!v) return;
        v.playbackRate = s;
        setSpeed(s);
        setShowSettings(false);
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;
    const buffPct  = duration ? (buffered   / duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            className={`vp-wrapper${fullscreen ? ' vp-wrapper--fullscreen' : ''}`}
            onMouseMove={resetHideTimer}
            onMouseLeave={() => playing && setShowControls(false)}
            onClick={() => { if (showSettings) setShowSettings(false); }}
            tabIndex={0}
        >
            <video
                ref={videoRef}
                src={src}
                autoPlay={autoPlay}
                className="vp-video"
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
            />

            {!playing && (
                <div className="vp-centre-btn" onClick={togglePlay}>
                    <div className="vp-centre-btn__inner">
                        <IconPlay />
                    </div>
                </div>
            )}

            <div className={`vp-overlay ${showControls ? 'vp-overlay--visible' : 'vp-overlay--hidden'}`}>

                <div className="vp-progress" onClick={seekTo}>
                    <div className="vp-progress__track">
                        <div className="vp-progress__buffered" style={{ width: `${buffPct}%` }} />
                        <div className="vp-progress__fill"     style={{ width: `${progress}%` }} />
                        <div className="vp-progress__thumb"    style={{ left: `${progress}%` }} />
                    </div>
                </div>

                <div className="vp-controls">
                    <div className="vp-controls__group">
                        <button className="vp-btn" onClick={togglePlay}
                            title={playing ? 'Пауза (Space)' : 'Відтворити (Space)'}>
                            {playing ? <IconPause /> : <IconPlay />}
                        </button>

                        <button className="vp-btn" onClick={() => seek(-10)} title="-10с">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                                <text x="7.5" y="15" fontSize="5.5" fontWeight="700" fill="currentColor" textAnchor="middle">10</text>
                            </svg>
                        </button>

                        <button className="vp-btn" onClick={() => seek(10)} title="+10с">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                                <text x="15" y="15" fontSize="5.5" fontWeight="700" fill="currentColor" textAnchor="middle">10</text>
                            </svg>
                        </button>

                        <button className="vp-btn" onClick={toggleMute} title="Звук (M)">
                            <IconVolume muted={muted} level={volume} />
                        </button>

                        <div className="vp-volume-wrap">
                            <input
                                type="range"
                                min="0" max="1" step="0.02"
                                value={muted ? 0 : volume}
                                onChange={(e) => setVolumeTo(parseFloat(e.target.value))}
                                className="vp-volume-slider"
                            />
                        </div>

                        <span className="vp-time">
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </span>
                    </div>

                    <div className="vp-controls__group">
                        <div className="vp-settings-wrap">
                            <button
                                className="vp-btn vp-btn--speed"
                                onClick={(e) => { e.stopPropagation(); setShowSettings((v) => !v); }}
                                title="Швидкість"
                            >
                                {speed}×
                            </button>

                            {showSettings && (
                                <div className="vp-settings-menu" onClick={(e) => e.stopPropagation()}>
                                    <p className="vp-settings-menu__title">Швидкість</p>
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                                        <button
                                            key={s}
                                            className={`vp-settings-menu__item${speed === s ? ' vp-settings-menu__item--active' : ''}`}
                                            onClick={() => setPlaybackSpeed(s)}
                                        >
                                            {s === 1 ? 'Звичайна' : `${s}×`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="vp-btn" onClick={toggleFullscreen} title="На весь екран (F)">
                            {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;