import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchAPI, getUploadsBaseUrl } from "../services/api";
import LiveStreamPlayer from "../features/components/LiveStreamPlayer";
import StreamChat from "../features/components/StreamChat";
import "../styles/StreamPage.css";

export default function StreamPage() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [streamData, setStreamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await fetchAPI(`/streams/status/${userId}`, { method: "GET" });
                if (cancelled) return;

                if (!data.live) {
                    setOffline(true);
                } else {
                    setStreamData(data);
                }
            } catch {
                if (!cancelled) setOffline(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userId]);

    if (loading) {
        return (
            <div className="stream-page">
                <p className="stream-page__loading">Завантаження стріму…</p>
            </div>
        );
    }

    if (offline || !streamData) {
        return (
            <div className="stream-page">
                <div className="stream-page__offline">
                    <h2>Стрім офлайн</h2>
                    <p>Цей канал зараз не веде трансляцію.</p>
                    <button
                        type="button"
                        className="stream-page__back-btn"
                        onClick={() => navigate(-1)}
                    >
                        Повернутися
                    </button>
                </div>
            </div>
        );
    }

    const avatarSrc = streamData.avatar_url
        ? getUploadsBaseUrl() + streamData.avatar_url
        : null;

    const title = streamData.stream_title || `Стрім ${streamData.nickname}`;
    const description = streamData.stream_description || "";

    return (
        <div className="stream-page">
            <div className="stream-page__body">
                {/* Left: player + info */}
                <div className="stream-page__main">
                    <div className="stream-page__player">
                        <LiveStreamPlayer
                            streamKey={streamData.stream_key}
                            nickname={streamData.nickname}
                        />
                    </div>

                    {/* Stream info */}
                    <div className="stream-page__info">
                        <h1 className="stream-page__title">{title}</h1>
                        {description && (
                            <p className="stream-page__description">{description}</p>
                        )}
                    </div>

                    {/* Channel info */}
                    <div className="stream-page__channel">
                        <Link to={`/profile/${streamData.user_id}`} className="stream-page__channel-link">
                            <span className="stream-page__avatar">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="" />
                                ) : (
                                    <span className="stream-page__avatar-placeholder">?</span>
                                )}
                            </span>
                            <span className="stream-page__channel-name">{streamData.nickname}</span>
                            <span className="stream-page__live-badge">LIVE</span>
                        </Link>

                        {streamData.bio && (
                            <p className="stream-page__bio">{streamData.bio}</p>
                        )}
                    </div>
                </div>

                {/* Right: chat */}
                <aside className="stream-page__chat">
                    <StreamChat streamUserId={userId} />
                </aside>
            </div>
        </div>
    );
}
