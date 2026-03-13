import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import { fetchAPI } from '../../services/api';
import VideoEditModal from './VideoEditModal';
import VideoPlayer from './VideoPlayer';

const VideoModal = ({ video_id, onClose, onVideoUpdate, onVideoDelete }) => {
    const [videoBlobUrl, setVideoBlobUrl] = useState(null);
    const [videoInfo,    setVideoInfo   ] = useState(null);
    const [error,        setError       ] = useState(null);
    const [editingVideo, setEditingVideo] = useState(null);

    const watchStartTime    = useRef(null);
    const totalWatchTime    = useRef(0);
    const lastTimeUpdate    = useRef(0);
    const hasRecordedWatch  = useRef(false);

    const currentUser = authService.getCurrentUser();
    const isOwner     = currentUser && videoInfo && currentUser.user_id === videoInfo.user_id;

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const videoData = await fetchAPI(`/videos/${video_id}`, { method: 'GET' });
                setVideoInfo(videoData);

                const token      = authService.getToken();
                const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response   = await fetch(`${apiBaseUrl}/videos/${video_id}/watch`, {
                    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
                });

                if (!response.ok) throw new Error('Failed to fetch video');

                const blob = await response.blob();
                setVideoBlobUrl(URL.createObjectURL(blob));
            } catch (err) {
                console.error(err);
                setError('Не вдалося завантажити відео');
            }
        };

        fetchVideo();
        return () => { if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl); };
    }, [video_id]);

    const recordWatchTime = async (watchDuration) => {
        if (hasRecordedWatch.current) return;
        hasRecordedWatch.current = true;
        try {
            await fetchAPI(`/videos/${video_id}/watch`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ watchDuration }),
            });
        } catch (err) {
            console.error('Failed to record watch time:', err);
        }
    };

    const handleTimeUpdate = (currentTime) => {
        if (watchStartTime.current) {
            const timeWatched = currentTime - lastTimeUpdate.current;
            if (timeWatched > 0.5) {
                totalWatchTime.current += timeWatched;
                lastTimeUpdate.current  = currentTime;
            }
        } else {
            watchStartTime.current = Date.now();
            lastTimeUpdate.current = currentTime;
        }
    };

    const handleEnded = () => recordWatchTime(totalWatchTime.current);

    const handleClose = () => {
        recordWatchTime(totalWatchTime.current);
        onClose();
    };

    if (!video_id) return null;

    return (
        <div
            style={{
                position:        'fixed',
                top: 0, left: 0,
                width:           '100%',
                height:          '100%',
                backgroundColor: 'rgba(0,0,0,0.85)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          1000,
            }}
            onClick={handleClose}
        >
            <div
                style={{ position: 'relative', width: '80%', maxWidth: '900px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top bar */}
                <div className="vm-topbar">
                    {videoInfo && (
                        <div className="vm-title-block">
                            <h2 className="vm-title">{videoInfo.title}</h2>
                            {videoInfo.description && (
                                <p className="vm-description">{videoInfo.description}</p>
                            )}
                        </div>
                    )}

                    <div className="vm-actions">
                        {isOwner && videoInfo && (
                            <>
                                <button
                                    className="vm-btn vm-btn--edit"
                                    onClick={(e) => { e.stopPropagation(); setEditingVideo(videoInfo); }}
                                >
                                    Редагувати
                                </button>
                                <button
                                    className="vm-btn vm-btn--delete"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Ви впевнені, що хочете видалити це відео?')) {
                                            try {
                                                await fetchAPI(`/videos/${video_id}`, { method: 'DELETE' });
                                                onVideoDelete?.(video_id);
                                                onClose();
                                            } catch { alert('Не вдалося видалити відео'); }
                                        }
                                    }}
                                >
                                    Видалити
                                </button>
                            </>
                        )}
                        <button className="vm-btn--close" onClick={handleClose}>
                            &times;
                        </button>
                    </div>
                </div>

                {/* Player */}
                {error ? (
                    <p className="vm-error">{error}</p>
                ) : (
                    <VideoPlayer
                        src={videoBlobUrl}
                        title={videoInfo?.title}
                        autoPlay
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                    />
                )}
            </div>

            {editingVideo && (
                <VideoEditModal
                    video_id={editingVideo.video_id}
                    video={editingVideo}
                    onClose={() => {
                        setEditingVideo(null);
                        fetchAPI(`/videos/${video_id}`, { method: 'GET' }).then(setVideoInfo);
                    }}
                    onUpdate={(updatedVideo) => {
                        setVideoInfo(updatedVideo);
                        setEditingVideo(null);
                        onVideoUpdate?.(updatedVideo);
                    }}
                    onDelete={(deletedId) => {
                        onVideoDelete?.(deletedId);
                        onClose();
                    }}
                />
            )}
        </div>
    );
};

export default VideoModal;