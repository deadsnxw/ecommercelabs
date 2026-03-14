import { pool } from "../db/db.js";
import { logger } from "../utils/logger.js";

export const getHealth = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    logger.error("Health check DB error", { error: error.message, stack: error.stack });
    return res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
};