import React from "react";
import { useNavigate } from "react-router-dom";
import { getUploadsBaseUrl } from "../../services/api";
import "../../styles/LiveStream.css";

/**
 * A card that represents a live channel in the recommendations grid.
 *
 * Props:
 *   stream — { user_id, nickname, avatar_url, stream_key }
 */
export default function LiveStreamCard({ stream }) {
  const navigate = useNavigate();
  const STREAM_BASE =
    process.env.REACT_APP_STREAM_URL || "http://localhost:8081/hls";

  const avatarSrc = stream.avatar_url
    ? getUploadsBaseUrl() + stream.avatar_url
    : null;

  return (
    <div
      className="ls-card"
      onClick={() => navigate(`/stream/${stream.user_id}`)}
    >
      {/* thumbnail — we use a black placeholder; HLS preview not trivial */}
      <div className="ls-card__thumb">
        <span className="ls-card__badge">LIVE</span>
      </div>

      <div className="ls-card__info">
        <div className="ls-card__avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" />
          ) : (
            <span>?</span>
          )}
        </div>
        <div className="ls-card__text">
          <p className="ls-card__name">{stream.nickname}</p>
          <p className="ls-card__sub">Зараз у прямому ефірі</p>
        </div>
      </div>
    </div>
  );
}
