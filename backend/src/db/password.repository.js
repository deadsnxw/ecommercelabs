import { pool } from "../db/db.js";

export const createResetCode = async ({
  userId,
  codeHash,
  expiresAt,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO password_reset_codes (
      user_id,
      code_hash,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [userId, codeHash, expiresAt]
  );

  return rows[0];
};

export const findValidResetCode = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM password_reset_codes
    WHERE user_id = $1
      AND used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );
  return rows[0];
};

export const markResetCodeAsUsed = async (id) => {
  await pool.query(
    `
    UPDATE password_reset_codes
    SET used = true
    WHERE id = $1
    `,
    [id]
  );
};

export const deleteOldResetCodes = async (userId) => {
  await pool.query(
    `
    DELETE FROM password_reset_codes
    WHERE user_id = $1
    `,
    [userId]
  );
};

export const findResetCodeByHash = async (userId, codeHash) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM password_reset_codes
    WHERE user_id = $1
      AND code_hash = $2
      AND used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, codeHash]
  );
  return rows[0];
};