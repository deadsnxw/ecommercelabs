import { pool } from '../db/db.js';
import { logger } from '../utils/logger.js';

const RTMP_STAT_URL = process.env.RTMP_STAT_URL || 'http://nginx-rtmp/stat';

function parseActiveStreamKeys(xml) {
    const keys = [];
    const appBlock = xml.match(
        /<application>\s*<name>stream<\/name>([\s\S]*?)<\/application>/
    );
    if (!appBlock) return keys;

    const streamNameRe = /<stream>\s*<name>([^<]+)<\/name>/g;
    let m;
    while ((m = streamNameRe.exec(appBlock[1])) !== null) {
        keys.push(m[1]);
    }
    return keys;
}

export const getLiveStreams = async (req, res) => {
    try {
        const response = await fetch(RTMP_STAT_URL);
        if (!response.ok) return res.json({ streams: [] });

        const xml = await response.text();
        const activeKeys = parseActiveStreamKeys(xml);

        if (activeKeys.length === 0) return res.json({ streams: [] });

        const placeholders = activeKeys.map((_, i) => `$${i + 1}`).join(', ');
        const { rows } = await pool.query(
            `SELECT u.user_id, u.nickname, u.avatar_url, u.stream_key,
                    u.stream_title, u.stream_description, u.bio
             FROM users u
             WHERE u.stream_key IN (${placeholders})
               AND u.is_active = true`,
            activeKeys
        );

        let streams = rows;
        const q = req.query?.q;
        if (q && String(q).trim().length > 0) {
            const term = String(q).trim().toLowerCase();
            streams = rows.filter(
                (u) =>
                    (u.nickname && u.nickname.toLowerCase().includes(term)) ||
                    (u.stream_title && u.stream_title.toLowerCase().includes(term))
            );
        }

        res.json({ streams });
    } catch (err) {
        logger.error("getLiveStreams error", { error: err.message, stack: err.stack });
        res.json({ streams: [] });
    }
};

export const getMyStreamKey = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT stream_key FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (!rows[0]) return res.status(404).json({ message: 'User not found' });

        let streamKey = rows[0].stream_key;

        if (!streamKey) {
            streamKey = `stream_${req.user.user_id}`;
            await pool.query(
                `UPDATE users SET stream_key = $1 WHERE user_id = $2`,
                [streamKey, req.user.user_id]
            );
        }

        res.json({
            stream_key: streamKey,
            rtmp_url: 'rtmp://localhost:1935/stream',
        });
    } catch (err) {
        logger.error("getMyStreamKey error", { error: err.message, stack: err.stack });
        res.status(500).json({ message: 'Failed to get stream key' });
    }
};

export const updateStreamInfo = async (req, res) => {
    try {
        const { stream_title, stream_description } = req.body;
        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof stream_title === 'string') {
            fields.push(`stream_title = $${idx++}`);
            values.push(stream_title.slice(0, 200));
        }
        if (typeof stream_description === 'string') {
            fields.push(`stream_description = $${idx++}`);
            values.push(stream_description.slice(0, 2000));
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        values.push(req.user.user_id);
        await pool.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
            values
        );

        res.json({ message: 'Stream info updated' });
    } catch (err) {
        logger.error("updateStreamInfo error", { error: err.message, stack: err.stack });
        res.status(500).json({ message: 'Failed to update stream info' });
    }
};

export const getStreamStatus = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.user_id, u.nickname, u.avatar_url, u.bio,
                    u.stream_key, u.stream_title, u.stream_description
             FROM users u
             WHERE u.user_id = $1 AND u.is_active = true`,
            [req.params.userId]
        );

        if (!rows[0] || !rows[0].stream_key) {
            return res.json({ live: false });
        }

        const response = await fetch(RTMP_STAT_URL);
        if (!response.ok) return res.json({ live: false });

        const xml = await response.text();
        const activeKeys = parseActiveStreamKeys(xml);

        const user = rows[0];
        res.json({
            live: activeKeys.includes(user.stream_key),
            stream_key: user.stream_key,
            stream_title: user.stream_title,
            stream_description: user.stream_description,
            user_id: user.user_id,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            bio: user.bio,
        });
    } catch (err) {
        logger.error("getStreamStatus error", { error: err.message, stack: err.stack });
        res.json({ live: false });
    }
};