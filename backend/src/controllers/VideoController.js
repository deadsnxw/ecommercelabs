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

export const watchVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await getVideoById(id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        // ВИПРАВЛЕНО: підтримка обох варіантів
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
        console.error('Watch video error:', error);
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

        // ВИПРАВЛЕНО: підтримка обох варіантів
        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const videoUrl = `${baseUrl}/uploads/videos/${videoFile.filename}`;
        const thumbnailUrl = thumbnailFile ? `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}` : null;

        // Parse tags from request body (can be comma-separated string or array)
        let tagArray = [];
        if (tags) {
            if (typeof tags === 'string') {
                tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            } else if (Array.isArray(tags)) {
                tagArray = tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(t => t.length > 0);
            }
        }

        const video = await createVideo({
            userId: userId,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl,
            duration: null,
            fileSize: videoFile.size,
            mimeType: videoFile.mimetype,
            tags: tagArray
        });

        res.status(201).json({
            message: 'Video uploaded successfully',
            video
        });
    } catch (error) {
        console.error('Upload video error:', error);
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

        // ВИПРАВЛЕНО: підтримка обох варіантів
        const userId = req.user?.user_id || req.user?.id;

        if (!video.is_public && (!req.user || userId !== video.user_id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(video);
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({ message: 'Failed to get video', error: error.message });
    }
};

export const getPublicVideos = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const videos = await getAllPublicVideos(parseInt(limit), parseInt(offset));

        res.json({
            videos,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get public videos error:', error);
        res.status(500).json({ message: 'Failed to get videos', error: error.message });
    }
};

export const getMyVideos = async (req, res) => {
    try {
        // ВИПРАВЛЕНО: підтримка обох варіантів
        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const videos = await getUserVideos(userId, true); // Включаючи приватні

        res.json({ videos });
    } catch (error) {
        console.error('Get my videos error:', error);
        res.status(500).json({ message: 'Failed to get videos', error: error.message });
    }
};

export const getUserVideosList = async (req, res) => {
    try {
        const { userId } = req.params;

        // ВИПРАВЛЕНО: підтримка обох варіантів
        const currentUserId = req.user?.user_id || req.user?.id;

        const includePrivate = req.user && currentUserId === parseInt(userId);
        const videos = await getUserVideos(userId, includePrivate);

        res.json({ videos });
    } catch (error) {
        console.error('Get user videos error:', error);
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

        // Обновление миниатюры если загружена новая
        const thumbnailFile = req.files?.thumbnail?.[0];
        if (thumbnailFile) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            updateData.thumbnail_url = `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}`;
        }

        const video = await updateVideo(id, userId, updateData);
        if (!video) return res.status(404).json({ message: 'Video not found or access denied' });

        // Обновление тегов если переданы
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
        console.error('Update video error:', error);
        res.status(500).json({ message: 'Failed to update video', error: error.message });
    }
};

export const deleteVideoById = async (req, res) => {
    try {
        const { id } = req.params;

        // ВИПРАВЛЕНО: підтримка обох варіантів
        const userId = req.user.user_id || req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // ДОДАНО: логування для дебагу
        console.log('Delete video request:', {
            videoId: id,
            userId: userId
        });

        const video = await deleteVideo(id, userId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found or access denied' });
        }

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({ message: 'Failed to delete video', error: error.message });
    }
};

export const recordWatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { watchDuration } = req.body; // in seconds

        if (typeof watchDuration !== 'number' || watchDuration < 0) {
            return res.status(400).json({ message: 'Invalid watch duration' });
        }

        const video = await getVideoById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // ВИПРАВЛЕНО: підтримка обох варіантів
        const userId = req.user?.user_id || req.user?.id;

        // Don't count views from the video owner
        if (req.user && userId === video.user_id) {
            // Still record the view for analytics, but don't increment count
            const ipAddress = req.ip || req.connection.remoteAddress;
            await recordVideoView(id, userId, ipAddress, Math.round(watchDuration));
            return res.json({ message: 'View recorded (owner view, count not incremented)' });
        }

        // Very short videos (1-4 seconds): require 50% of duration (handles 1-second videos)
        // Short videos (5-120 seconds / 2 minutes): require 2 seconds
        // Long videos (>120 seconds): require 30 seconds or 50% of duration, whichever is smaller
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
        
        // Ensure required time never exceeds video duration (safety check)
        requiredWatchTime = Math.min(requiredWatchTime, videoDuration);

        // Record the view
        const ipAddress = req.ip || req.connection.remoteAddress;
        await recordVideoView(id, userId, ipAddress, Math.round(watchDuration));

        // Only increment view count if watch duration meets threshold
        if (watchDuration >= requiredWatchTime) {
            await incrementViewCount(id);
            res.json({ message: 'View counted', counted: true });
        } else {
            res.json({ message: 'View recorded but not counted (insufficient watch time)', counted: false });
        }
    } catch (error) {
        console.error('Record watch error:', error);
        res.status(500).json({ message: 'Failed to record watch', error: error.message });
    }
};

export const searchVideosController = async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;

        if (!q || q.trim().length === 0) {
            // If no search query, return all public videos
            const videos = await getAllPublicVideos(parseInt(limit), parseInt(offset));
            return res.json({
                videos,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }

        const videos = await searchVideos(q.trim(), parseInt(limit), parseInt(offset));

        res.json({
            videos,
            query: q.trim(),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Search videos error:', error);
        res.status(500).json({ message: 'Failed to search videos', error: error.message });
    }
};

export const getPopularTagsController = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const tags = await getPopularTags(limit);
        res.json({ tags });
    } catch (error) {
        console.error('Get popular tags error:', error);
        res.status(500).json({ message: 'Failed to get popular tags', error: error.message });
    }
};