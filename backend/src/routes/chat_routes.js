import express from "express";
import {
    startChat,
    getMyChats,
    getChatMessagesById,
    getMyRequests,
    acceptRequest,
    ignoreRequest,
    deleteChatController
} from "../controllers/ChatController.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", authenticateToken, startChat);
router.get("/my", authenticateToken, getMyChats);
router.get("/requests", authenticateToken, getMyRequests);
router.post("/:chatId/accept", authenticateToken, acceptRequest);
router.post("/:chatId/ignore", authenticateToken, ignoreRequest);
router.delete("/:chatId", authenticateToken, deleteChatController);
router.get("/:chatId/messages", authenticateToken, getChatMessagesById);

export default router;