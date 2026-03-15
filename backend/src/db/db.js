import pkg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

pool.on('connect', () => {
    logger.info('Connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error('PostgreSQL pool error', { error: err.message, stack: err.stack });
});