import { pool } from "../db/db.js";

export const getHealth = async (req, res) => {
  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });

  } catch (error) {
    console.error('Health check DB error:', error);

    return res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
};