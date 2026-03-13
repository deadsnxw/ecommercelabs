import multer from 'multer';
import path from 'path';
import fs from 'fs';

const AVATARS_DIR = path.resolve(process.env.AVATARS_DIR || './uploads/avatars');

if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AVATARS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        const userId = req.user?.user_id || 'anon';
        cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    if (imageMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid avatar type. Only image files are allowed.'), false);
    }
};

export const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    }
});

