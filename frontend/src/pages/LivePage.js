import React, { useState } from "react";
import LivePlayer from "../features/components/LivePlayer";

export default function LivePage() {
    const base = process.env.REACT_APP_STREAM_URL || "http://localhost:8081/hls";
    const defaultUrl = `${base}/stream.m3u8`;
    const [url, setUrl] = useState(defaultUrl);

    return (
        <div>
            <h1>Live</h1>
            <p>Stream URL: <code>{url}</code></p>
            <p>OBS RTMP URL: <code>rtmp://localhost:1935/stream</code> and Stream Key: <code>stream</code></p>
            <div style={{ margin: '1rem 0' }}>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: 400 }} />
            </div>
            <LivePlayer url={url} />
        </div>
    );
}
