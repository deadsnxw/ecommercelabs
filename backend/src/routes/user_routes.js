import express from 'express';
import {
    getMe,
    getUser,
    getUsers,
    getRecommendedUsers,
    searchUsersController,
    updateMe,
    uploadMyAvatar,
    uploadMyBanner,
} from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../config/avatarUpload.config.js';
import { uploadBanner } from '../config/bannerUpload.config.js';

const router = express.Router();

router.get('/me', authenticateToken, getMe);
router.get('/recommended', authenticateToken, getRecommendedUsers);
router.get('/search', searchUsersController);
router.get('/', getUsers);
router.post('/me/avatar', authenticateToken, uploadAvatar.single('avatar'), uploadMyAvatar);
router.post('/me/banner', authenticateToken, uploadBanner.single('banner'), uploadMyBanner);
router.get('/:id', getUser);
router.patch('/me', authenticateToken, updateMe);

export default router;
