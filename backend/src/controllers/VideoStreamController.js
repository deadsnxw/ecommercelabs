import fs from 'fs';
import path from 'path';
import { getVideoById } from '../db/video.repository.js';

export const watchVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const range = req.headers.range;

        if (!range) {
            return res.status(416).json({ message: 'Range header is required' });
        }

        const video = await getVideoById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (!video.is_public && (!req.user || req.user.user_id !== video.user_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const videoPath = path.resolve(`.${video.video_url}`);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ message: 'Video file not found' });
        }

        const videoSize = fs.statSync(videoPath).size;

        const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': video.mime_type || 'video/mp4'
        });

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.pipe(res);
    } catch (error) {
        console.error('Watch video error:', error);
        res.status(500).json({ message: 'Failed to stream video' });
    }
};