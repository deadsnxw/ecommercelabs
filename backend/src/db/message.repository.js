import { pool } from "./db.js";

export const createMessage = async ({ chatId, senderId, text }) => {
    const { rows } = await pool.query(
        `
        INSERT INTO messages (chat_id, sender_id, text)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [chatId, senderId, text]
    );

    return rows[0];
};

export const getChatMessages = async chatId => {
    const { rows } = await pool.query(
        `
        SELECT *
        FROM messages
        WHERE chat_id = $1
        ORDER BY created_at ASC
        `,
        [chatId]
    );

    return rows;
};