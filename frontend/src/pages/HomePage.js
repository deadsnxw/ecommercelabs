import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchAPI, getUploadsBaseUrl } from "../services/api";
import VideoCard from "../features/components/VideoCard";
import VideoModal from "../features/components/VideoModal";
import LiveStreamCard from "../features/components/LiveStreamCard";
import useLiveStreams from "../hooks/useLiveStreams";
import "../styles/HomePage.css";

export default function HomePage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFeed = searchParams.get("feed");
  const urlQ = searchParams.get("q");

  const [videos, setVideos] = useState([]);
  const [searchStreams, setSearchStreams] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [feedType, setFeedType] = useState(urlFeed === "subscriptions" ? "subscriptions" : "all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlQ || "");
  const [isSearching, setIsSearching] = useState(!!urlQ);

  const { liveStreams } = useLiveStreams(!!user);

  const loadVideos = async (type = "all") => {
    try {
      setLoading(true);
      let data;

      if (type === "subscriptions") {
        data = await fetchAPI("/subscriptions/feed", { method: "GET" });
      } else {
        data = await fetchAPI("/videos/public", { method: "GET" });
      }

      setVideos(data.videos || []);
      setIsSearching(false);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.set("q", q);
        next.delete("feed");
        return next;
      });
    } else {
      setSearchParams({});
      setIsSearching(false);
      loadVideos(feedType);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchParams({});
    loadVideos(feedType);
  };

  // Sync feed type from URL
  useEffect(() => {
    const feed = urlFeed === "subscriptions" ? "subscriptions" : "all";
    setFeedType(feed);
  }, [urlFeed]);

  // Sync search from URL and run search when q is present
  useEffect(() => {
    if (urlQ != null && urlQ !== searchQuery) {
      setSearchQuery(urlQ);
      setIsSearching(!!urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    if (isSearching && searchQuery.trim()) {
      const run = async () => {
        try {
          setLoading(true);
          const q = encodeURIComponent(searchQuery.trim());
          const [videoRes, streamRes, userRes] = await Promise.all([
            fetchAPI(`/videos/search?q=${q}`, { method: "GET" }),
            fetchAPI(`/streams/live?q=${q}`, { method: "GET" }),
            fetchAPI(`/users/search?q=${q}`, { method: "GET" }),
          ]);
          setVideos(videoRes.videos || []);
          setSearchStreams(streamRes.streams || []);
          setSearchUsers(Array.isArray(userRes) ? userRes : []);
        } catch (err) {
          console.error("Failed to search", err);
          setVideos([]);
          setSearchStreams([]);
          setSearchUsers([]);
        } finally {
          setLoading(false);
        }
      };
      run();
    } else {
      setSearchStreams([]);
      setSearchUsers([]);
      loadVideos(feedType);
    }
  }, [feedType, isSearching, searchQuery]);

  const handleVideoClick = (video_id) => {
    setSelectedVideoId(video_id);
  };

  const handleCloseModal = () => {
    setSelectedVideoId(null);
  };

  return (
    <div className="home-container">
      <div className="home-header-row">
        <h1 className="home-header-title">
          {isSearching
            ? `Результати пошуку: "${searchQuery}"`
            : feedType === "subscriptions"
            ? "Підписки"
            : "Рекомендації"}
        </h1>

        <div className="home-header-buttons">
          {user && !isSearching && (
            <>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className={`home-toggle-btn ${feedType === "all" ? "active" : ""}`}
              >
                Всі відео
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ feed: "subscriptions" })}
                className={`home-toggle-btn ${feedType === "subscriptions" ? "active" : ""}`}
              >
                Підписки
              </button>
            </>
          )}
          {isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="home-clear-search-btn"
            >
              Очистити пошук
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="home-search-form">
        <input
          type="text"
          placeholder="Пошук за назвою, тегами або нікнеймом..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="home-search-input"
        />
        <button type="submit" className="home-search-button">
          Пошук
        </button>
      </form>

      {loading && <p>Завантаження...</p>}

      {/* Search results: Content (streams + videos) and People (only if any) */}
      {!loading && isSearching && (
        <>
          {/* Content section: live streams matching query + videos */}
          <section className="home-search-section">
            <h2 className="home-search-section-title">Контент</h2>
            {searchStreams.length > 0 && (
              <div className="home-live-grid">
                {searchStreams.map((s) => (
                  <LiveStreamCard key={s.user_id} stream={s} />
                ))}
              </div>
            )}
            <div className="home-videos-grid">
              {videos.map((v) => (
                <VideoCard key={v.video_id} video={v} onClick={handleVideoClick} />
              ))}
            </div>
            {searchStreams.length === 0 && videos.length === 0 && (
              <p className="home-search-empty">Нічого не знайдено за вашим запитом.</p>
            )}
          </section>

          {/* People section: only when there are users */}
          {searchUsers.length > 0 && (
            <section className="home-search-section">
              <h2 className="home-search-section-title">Користувачі</h2>
              <div className="home-search-users">
                {searchUsers.map((u) => (
                  <Link
                    key={u.user_id}
                    to={`/profile/${u.user_id}`}
                    className="home-search-user-card"
                  >
                    <div className="home-search-user-avatar">
                      {u.avatar_url ? (
                        <img src={getUploadsBaseUrl() + u.avatar_url} alt="" />
                      ) : (
                        <span>{u.nickname?.charAt(0).toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div className="home-search-user-info">
                      <span className="home-search-user-nickname">{u.nickname}</span>
                      <span className="home-search-user-subs">
                        {Number(u.subscriber_count || 0).toLocaleString("uk-UA")} підписників
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Non-search: Live streams */}
      {!loading && liveStreams.length > 0 && !isSearching && (
        <section className="home-live-section">
          <h2 className="home-live-title">
            <span className="ls-player__badge">LIVE</span>
            Зараз у прямому ефірі
          </h2>
          <div className="home-live-grid">
            {liveStreams.map((s) => (
              <LiveStreamCard key={s.user_id} stream={s} />
            ))}
          </div>
        </section>
      )}

      {!loading && !isSearching && videos.length === 0 && (
        <p>
          {feedType === "subscriptions"
            ? "Немає відео з каналів, на які ви підписані."
            : "Немає доступних відео."}
        </p>
      )}

      {!loading && !isSearching && (
        <div className="home-videos-grid">
          {videos.map((v) => (
            <VideoCard key={v.video_id} video={v} onClick={handleVideoClick} />
          ))}
        </div>
      )}

      {selectedVideoId && (
        <VideoModal
          video_id={selectedVideoId}
          onClose={handleCloseModal}
          onVideoUpdate={() => loadVideos(feedType)}
          onVideoDelete={() => {
            setVideos((prev) =>
              prev.filter((v) => v.video_id !== selectedVideoId),
            );
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
}