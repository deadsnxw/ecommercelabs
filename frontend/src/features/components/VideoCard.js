import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VideoCard = ({ video, isOwner, onClick, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${video.user_id}`);
  };

  return (
    <div
      className="video-card"
      style={{
        width: "250px",
        margin: "10px",
        cursor: "pointer",
        display: "inline-block",
        position: "relative",
      }}
      onClick={() => onClick(video.video_id)}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          backgroundColor: "#000",
        }}
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            No Thumbnail
          </div>
        )}
      </div>

      {/* Меню */}
      {isOwner && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            zIndex: 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            title="Інше"
          >
            <MenuIcon />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "32px",
                right: 0,
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                overflow: "hidden",
                minWidth: "140px",
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(video);
                }}
                style={menuButtonStyle}
              >
                Редагувати
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(video.video_id);
                }}
                style={{ ...menuButtonStyle, color: "#dc3545" }}
              >
                Видалити
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <h4 style={{ margin: "6px 0" }}>{video.title}</h4>

      {video.nickname && (
        <p
          onClick={handleUserClick}
          style={{
            fontSize: "12px",
            color: "#6441A5",
            margin: "4px 0",
            cursor: "pointer",
          }}
        >
          {video.nickname}
        </p>
      )}

      <p style={{ fontSize: "12px", color: "#555" }}>
        {video.views_count} views
      </p>

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "8px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {video.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.tag_id || tag.name}
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                backgroundColor: "#6441A5",
                color: "#fff",
                borderRadius: "3px",
                display: "inline-block",
              }}
            >
              {tag.name}
            </span>
          ))}
          {video.tags.length > 3 && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                color: "#6441A5",
              }}
            >
              +{video.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const menuButtonStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
};

const MenuIcon = () => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <span style={{ lineHeight: 1 }}>⋮</span>;
  }

  return (
    <img
      src="/other.png"
      alt="menu"
      onError={() => setImgError(true)}
      style={{
        width: "16px",
        height: "16px",
        objectFit: "contain",
      }}
    />
  );
};

export default VideoCard;