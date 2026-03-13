import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-dasdsadsadadasda',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};