import express from 'express';
import { getLiveStreams, getMyStreamKey, getStreamStatus, updateStreamInfo } from '../controllers/StreamController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public — anyone can see who is live
router.get('/live', getLiveStreams);

// Authenticated — get your own stream key
router.get('/me/key', authenticateToken, getMyStreamKey);

// Authenticated — update stream title / description
router.patch('/me/info', authenticateToken, updateStreamInfo);

// Public — check if a specific user is live
router.get('/status/:userId', getStreamStatus);

export default router;
