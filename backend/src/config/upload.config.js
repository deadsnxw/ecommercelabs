import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads/videos');
const THUMBNAILS_DIR = path.resolve(process.env.THUMBNAILS_DIR || './uploads/thumbnails');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'thumbnail') {
            cb(null, THUMBNAILS_DIR);
        } else {
            cb(null, UPLOAD_DIR);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        if (file.fieldname === 'thumbnail') {
            cb(null, `thumb-${uniqueSuffix}${ext}`);
        } else {
            cb(null, `video-${uniqueSuffix}${ext}`);
        }
    }
});

const fileFilter = (req, file, cb) => {
    const videoMimeTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
    ];

    const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    if (file.fieldname === 'thumbnail') {
        if (imageMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid thumbnail type. Only image files are allowed.'), false);
        }
        return;
    }

    if (videoMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

export const uploadVideo = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500 MB max
    }
});