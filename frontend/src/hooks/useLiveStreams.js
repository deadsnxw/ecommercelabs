import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAPI } from "../services/api";

const POLL_INTERVAL = 15_000; // 15 s

/*
 * Shared singleton so that multiple components mounting useLiveStreams
 * don't each create their own polling interval → only ONE fetch per tick.
 */
let _listeners = [];
let _streams = [];
let _timer = null;

async function _poll() {
  try {
    const data = await fetchAPI("/streams/live", { method: "GET" });
    _streams = data?.streams || [];
  } catch {
    _streams = [];
  }
  _listeners.forEach((fn) => fn(_streams));
}

function _subscribe(fn) {
  _listeners.push(fn);
  // start polling when first subscriber appears
  if (_listeners.length === 1) {
    _poll(); // immediate first fetch
    _timer = setInterval(_poll, POLL_INTERVAL);
  } else {
    // give late subscribers the last known state immediately
    fn(_streams);
  }
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
    if (_listeners.length === 0 && _timer) {
      clearInterval(_timer);
      _timer = null;
    }
  };
}

/**
 * Hook that polls GET /api/streams/live and returns an array of live users.
 * Each entry: { user_id, nickname, avatar_url, stream_key }
 *
 * Multiple components can call this hook — only one global interval is used.
 */
export default function useLiveStreams(enabled = true) {
  const [liveStreams, setLiveStreams] = useState(_streams);

  useEffect(() => {
    if (!enabled) return;
    return _subscribe(setLiveStreams);
  }, [enabled]);

  const refresh = useCallback(() => _poll(), []);

  return { liveStreams, refresh };
}
