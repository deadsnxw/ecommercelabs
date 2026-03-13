import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config.js';

const SALT_ROUNDS = 10;

// хэширование пароля
export const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

// сравнение пароля с хэшем
export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// генерация джвт
export const generateToken = (payload) => {
    try {
        return jwt.sign(payload, jwtConfig.secret, {
            expiresIn: jwtConfig.expiresIn
        });
    } catch (error) {
        throw new Error('Error generating token');
    }
};

// верификация
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw new Error('Token verification failed');
    }
};