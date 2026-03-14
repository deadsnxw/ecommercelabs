import dotenv from 'dotenv';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import { pool } from './db/db.js';
import { logger } from './utils/logger.js';
dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    logger.info("New user connected", { socketId: socket.id });

    /* ── Private chats ── */
    socket.on("join_chat", (chatId) => {
        socket.join(`chat_${chatId}`);
        logger.info("Socket joined chat", { socketId: socket.id, chatId });
    });

    socket.on("send_message", async ({ chatId, senderId, text }) => {
        const message = await import("./db/message.repository.js").then(mod =>
            mod.createMessage({ chatId, senderId, text })
        );
        io.to(`chat_${chatId}`).emit("new_message", message);
    });

    socket.on("join_stream_chat", (streamUserId) => {
        const room = `stream_${streamUserId}`;
        socket.join(room);
        logger.info("Socket joined stream chat", { socketId: socket.id, room });
    });

    socket.on("leave_stream_chat", (streamUserId) => {
        socket.leave(`stream_${streamUserId}`);
    });

    socket.on("stream_chat_message", ({ streamUserId, nickname, text }) => {
        if (!text || !text.trim()) return;
        const msg = {
            id: `${socket.id}_${Date.now()}`,
            nickname: nickname || "Анонім",
            text: text.trim().slice(0, 500),
            timestamp: Date.now(),
        };
        io.to(`stream_${streamUserId}`).emit("stream_chat_message", msg);
    });

    socket.on("disconnect", () => {
        logger.info("User disconnected", { socketId: socket.id });
    });
});

server.listen(PORT, HOST, () => {
    logger.info("Server started", { host: HOST, port: PORT, env: process.env.NODE_ENV });
});

process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, starting graceful shutdown");
    try {
        io.close(() => {
            logger.info("Socket.IO connections closed");
        });
        server.close(async () => {
            logger.info("HTTP server closed");
            await pool.end();
            logger.info("Database connections closed");
            process.exit(0);
        });
    } catch (err) {
        logger.error("Error during shutdown", { error: err.message, stack: err.stack });
        process.exit(1);
    }
});

export { io };