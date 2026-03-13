import { Router } from 'express';
import {
    uploadVideo,
    getVideo,
    getPublicVideos,
    getMyVideos,
    getUserVideosList,
    updateVideoDetails,
    deleteVideoById,
    watchVideo,
    recordWatch,
    searchVideosController,
    getPopularTagsController
} from '../controllers/VideoController.js';

import { uploadVideo as uploadMiddleware } from '../config/upload.config.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/upload',
    authenticateToken,
    uploadMiddleware.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    uploadVideo
);

router.get('/search', searchVideosController);

router.get('/tags/popular', getPopularTagsController);

router.get('/public', getPublicVideos);

router.get('/me', authenticateToken, getMyVideos);

router.get('/user/:userId', getUserVideosList);

router.get('/:id', getVideo);

router.get('/:id/watch', authenticateToken, watchVideo);

router.post('/:id/watch', authenticateToken, recordWatch);

router.put(
    '/:id',
    authenticateToken,
    uploadMiddleware.fields([
        { name: 'thumbnail', maxCount: 1 }
    ]),
    updateVideoDetails
);

router.delete('/:id', authenticateToken, deleteVideoById);

export default router;