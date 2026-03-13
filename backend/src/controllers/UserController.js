import { getAllUsers, getRecommendedUsersForSubscriber, getUserById, updateUser, findUserByNickname, searchUsersByNickname } from '../db/user.repository.js';

const BIO_MAX_LENGTH = 500;

export const getMe = async (req, res) => {
    const user = await getUserById(req.user.user_id);
    res.json(user);
};

export const getUser = async (req, res) => {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
};

export const getUsers = async (req, res) => {
    const users = await getAllUsers();
    res.json(users);
};

export const searchUsersController = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        if (!q || String(q).trim().length === 0) {
            return res.json([]);
        }
        const users = await searchUsersByNickname(String(q).trim(), limit);
        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Failed to search users', error: error.message });
    }
};

export const getRecommendedUsers = async (req, res) => {
    try {
        const subscriberId = req.user?.user_id;
        const { limit } = req.query;

        const users = await getRecommendedUsersForSubscriber(subscriberId, limit);
        res.json(users);
    } catch (error) {
        console.error('Get recommended users error:', error);
        res.status(500).json({ message: 'Failed to get recommended users', error: error.message });
    }
};

export const updateMe = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const payload = {};
        if (typeof req.body.nickname === 'string') {
            const nickname = req.body.nickname.trim();
            if (!nickname) {
                return res.status(400).json({ message: 'Nickname is required' });
            }
            const existing = await findUserByNickname(nickname);
            if (existing && String(existing.user_id) !== String(userId)) {
                return res.status(400).json({ message: 'Nickname already exists' });
            }
            payload.nickname = nickname;
        }

        if (typeof req.body.bio === 'string') {
            if (req.body.bio.length > BIO_MAX_LENGTH) {
                return res.status(400).json({ message: `Bio must be at most ${BIO_MAX_LENGTH} characters` });
            }
            payload.bio = req.body.bio;
        }

        const updated = await updateUser(userId, payload);
        res.json(updated);
    } catch (error) {
        console.error('Update me error:', error);
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
};

export const uploadMyAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'avatar file is required' });
        }

        // served by express.static('/uploads', path.resolve('uploads'))
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const updated = await updateUser(req.user.user_id, { avatar_url: avatarUrl });
        res.json(updated);
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
    }
};

export const uploadMyBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'banner file is required' });
        }

        const bannerUrl = `/uploads/banners/${req.file.filename}`;
        const updated = await updateUser(req.user.user_id, { banner_url: bannerUrl });
        res.json(updated);
    } catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({ message: 'Failed to upload banner', error: error.message });
    }
};
