import fs from 'fs';
import path from 'path';
import {
    createVideo,
    getVideoById,
    getUserVideos,
    getAllPublicVideos,
    incrementViewCount,
    updateVideo,
    deleteVideo,
    recordVideoView,
    searchVideos,
    getPopularTags,
    replaceVideoTags,
    getVideoTags
} from '../db/video.repository.js';
import { logger } from '../utils/logger.js';

export const watchVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await getVideoById(id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const userId = req.user?.user_id || req.user?.id;

        if (!video.is_public && (!req.user || userId !== video.user_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const filePath = path.join('uploads', 'videos', path.basename(video.video_url));
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        const range = req.headers.range;
        if (!range) {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': video.mime_type || 'video/mp4'
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
                res.status(416).send('Requested range not satisfiable');
                return;
            }

            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': video.mime_type || 'video/mp4'
            });

            file.pipe(res);
        }
    } catch (error) {
        logger.error("Watch video error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to stream video', error: error.message });
    }
};

export const uploadVideo = async (req, res) => {
    try {
        const videoFile = req.files?.video?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];

        if (!videoFile) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        const { title, description, isPublic, tags } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const videoUrl = `${baseUrl}/uploads/videos/${videoFile.filename}`;
        const thumbnailUrl = thumbnailFile ? `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}` : null;

        let tagArray = [];
        if (tags) {
            if (typeof tags === 'string') {
                tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            } else if (Array.isArray(tags)) {
                tagArray = tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(t => t.length > 0);
            }
        }

        const video = await createVideo({
            userId,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl,
            duration: null,
            fileSize: videoFile.size,
            mimeType: videoFile.mimetype,
            tags: tagArray
        });

        res.status(201).json({ message: 'Video uploaded successfully', video });
    } catch (error) {
        logger.error("Upload video error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to upload video', error: error.message });
    }
};

export const getVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await getVideoById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const userId = req.user?.user_id || req.user?.id;

        if (!video.is_public && (!req.user || userId !== video.user_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(video);
    } catch (error) {
        logger.error("Get video error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to get video', error: error.message });
    }
};

export const getPublicVideos = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const videos = await getAllPublicVideos(parseInt(limit), parseInt(offset));
        res.json({ videos, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        logger.error("Get public videos error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to get videos', error: error.message });
    }
};

export const getMyVideos = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const videos = await getUserVideos(userId, true);
        res.json({ videos });
    } catch (error) {
        logger.error("Get my videos error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to get videos', error: error.message });
    }
};

export const getUserVideosList = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.user_id || req.user?.id;
        const includePrivate = req.user && currentUserId === parseInt(userId);
        const videos = await getUserVideos(userId, includePrivate);
        res.json({ videos });
    } catch (error) {
        logger.error("Get user videos error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to get videos', error: error.message });
    }
};

export const updateVideoDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isPublic, tags } = req.body;
        const userId = req.user.user_id || req.user.id;

        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const updateData = {};
        if (title       !== undefined) updateData.title       = title;
        if (description !== undefined) updateData.description = description;
        if (isPublic    !== undefined) updateData.is_public   = isPublic === 'true' || isPublic === true;

        const thumbnailFile = req.files?.thumbnail?.[0];
        if (thumbnailFile) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            updateData.thumbnail_url = `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}`;
        }

        const video = await updateVideo(id, userId, updateData);
        if (!video) return res.status(404).json({ message: 'Video not found or access denied' });

        if (tags !== undefined) {
            let tagArray = [];
            if (typeof tags === 'string') {
                tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            } else if (Array.isArray(tags)) {
                tagArray = tags.map(t => String(t).trim()).filter(t => t.length > 0);
            }
            video.tags = await replaceVideoTags(id, tagArray);
        } else {
            video.tags = await getVideoTags(id);
        }

        res.json({ message: 'Video updated successfully', video });
    } catch (error) {
        logger.error("Update video error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to update video', error: error.message });
    }
};

export const deleteVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        logger.info("Delete video request", { videoId: id, userId });

        const video = await deleteVideo(id, userId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found or access denied' });
        }

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        logger.error("Delete video error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to delete video', error: error.message });
    }
};

export const recordWatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { watchDuration } = req.body;

        if (typeof watchDuration !== 'number' || watchDuration < 0) {
            return res.status(400).json({ message: 'Invalid watch duration' });
        }

        const video = await getVideoById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const userId = req.user?.user_id || req.user?.id;

        if (req.user && userId === video.user_id) {
            const ipAddress = req.ip || req.connection.remoteAddress;
            await recordVideoView(id, userId, ipAddress, Math.round(watchDuration));
            return res.json({ message: 'View recorded (owner view, count not incremented)' });
        }

        const videoDuration = video.duration || 0;
        let requiredWatchTime;

        if (videoDuration <= 4) {
            requiredWatchTime = Math.max(1, Math.ceil(videoDuration * 0.5));
        } else if (videoDuration <= 120) {
            requiredWatchTime = 2;
        } else {
            const fiftyPercent = Math.ceil(videoDuration * 0.5);
            requiredWatchTime = Math.min(30, fiftyPercent);
        }

        requiredWatchTime = Math.min(requiredWatchTime, videoDuration);

        const ipAddress = req.ip || req.connection.remoteAddress;
        await recordVideoView(id, userId, ipAddress, Math.round(watchDuration));

        if (watchDuration >= requiredWatchTime) {
            await incrementViewCount(id);
            res.json({ message: 'View counted', counted: true });
        } else {
            res.json({ message: 'View recorded but not counted (insufficient watch time)', counted: false });
        }
    } catch (error) {
        logger.error("Record watch error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to record watch', error: error.message });
    }
};

export const searchVideosController = async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;

        if (!q || q.trim().length === 0) {
            const videos = await getAllPublicVideos(parseInt(limit), parseInt(offset));
            return res.json({ videos, limit: parseInt(limit), offset: parseInt(offset) });
        }

        const videos = await searchVideos(q.trim(), parseInt(limit), parseInt(offset));
        res.json({ videos, query: q.trim(), limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        logger.error("Search videos error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to search videos', error: error.message });
    }
};

export const getPopularTagsController = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const tags = await getPopularTags(limit);
        res.json({ tags });
    } catch (error) {
        logger.error("Get popular tags error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Failed to get popular tags', error: error.message });
    }
};