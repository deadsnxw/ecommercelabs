import { verifyToken } from '../utils/auth.utils.js';

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }
};