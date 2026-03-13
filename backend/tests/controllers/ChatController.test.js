import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    startChat,
    getMyChats,
    getChatMessagesById,
    getMyRequests,
    acceptRequest,
    ignoreRequest,
    deleteChatController,
} from '../../src/controllers/ChatController.js';

vi.mock('../../src/db/chat.repository.js', () => ({
    findChatBetweenUsers: vi.fn(),
    createChat: vi.fn(),
    findUserChatsWithLastMessage: vi.fn(),
    findUserChatRequests: vi.fn(),
    acceptChatRequest: vi.fn(),
    ignoreChatRequest: vi.fn(),
    deleteChat: vi.fn(),
}));

vi.mock('../../src/db/message.repository.js', () => ({
    getChatMessages: vi.fn(),
}));

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import {
    findChatBetweenUsers,
    createChat,
    findUserChatsWithLastMessage,
    findUserChatRequests,
    acceptChatRequest,
    ignoreChatRequest,
    deleteChat,
} from '../../src/db/chat.repository.js';
import { getChatMessages } from '../../src/db/message.repository.js';
import { pool } from '../../src/db/db.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('startChat', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если targetUserId не передан', async () => {
        const req = { user: { user_id: 1 }, body: {} };
        const res = makeRes();

        await startChat(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'targetUserId is required' });
    });

    it('возвращает 400 если targetUserId невалидный', async () => {
        const req = { user: { user_id: 1 }, body: { targetUserId: 'abc' } };
        const res = makeRes();

        await startChat(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid targetUserId' });
    });

    it('возвращает 400 если targetUserId равен currentUserId', async () => {
        const req = { user: { user_id: 1 }, body: { targetUserId: 1 } };
        const res = makeRes();

        await startChat(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'You cannot chat with yourself' });
    });

    it('возвращает существующий чат если уже есть', async () => {
        const fakeChat = { chat_id: 10, user1_id: 1, user2_id: 2 };
        findChatBetweenUsers.mockResolvedValue(fakeChat);

        const req = { user: { user_id: 1 }, body: { targetUserId: 2 } };
        const res = makeRes();

        await startChat(req, res);

        expect(createChat).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(fakeChat);
    });

    it('создаёт новый чат если его нет', async () => {
        const fakeChat = { chat_id: 11, user1_id: 1, user2_id: 2 };
        findChatBetweenUsers.mockResolvedValue(null);
        createChat.mockResolvedValue(fakeChat);

        const req = { user: { user_id: 1 }, body: { targetUserId: 2 } };
        const res = makeRes();

        await startChat(req, res);

        expect(createChat).toHaveBeenCalledWith(1, 2, 1);
        expect(res.json).toHaveBeenCalledWith(fakeChat);
    });

    it('возвращает 500 при ошибке', async () => {
        findChatBetweenUsers.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, body: { targetUserId: 2 } };
        const res = makeRes();

        await startChat(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
});

describe('getMyChats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает чаты текущего пользователя', async () => {
        const fakeChats = [{ chat_id: 1 }, { chat_id: 2 }];
        findUserChatsWithLastMessage.mockResolvedValue(fakeChats);

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMyChats(req, res);

        expect(findUserChatsWithLastMessage).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith(fakeChats);
    });
});

describe('getChatMessagesById', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 403 если юзер не участник чата', async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await getChatMessagesById(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('возвращает сообщения если юзер участник', async () => {
        pool.query.mockResolvedValue({ rows: [{ 1: 1 }] });
        const fakeMessages = [{ message_id: 1, text: 'hello' }];
        getChatMessages.mockResolvedValue(fakeMessages);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await getChatMessagesById(req, res);

        expect(getChatMessages).toHaveBeenCalledWith('5');
        expect(res.json).toHaveBeenCalledWith(fakeMessages);
    });
});

describe('getMyRequests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает входящие запросы на чат', async () => {
        const fakeRequests = [{ chat_id: 3 }];
        findUserChatRequests.mockResolvedValue(fakeRequests);

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMyRequests(req, res);

        expect(findUserChatRequests).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith(fakeRequests);
    });

    it('возвращает 500 при ошибке', async () => {
        findUserChatRequests.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMyRequests(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
});

describe('acceptRequest', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если chatId невалидный', async () => {
        const req = { user: { user_id: 1 }, params: { chatId: 'abc' } };
        const res = makeRes();

        await acceptRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid chat ID' });
    });

    it('возвращает 404 если запрос не найден', async () => {
        acceptChatRequest.mockResolvedValue(false);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await acceptRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Request not found or already handled' });
    });

    it('успешно принимает запрос', async () => {
        acceptChatRequest.mockResolvedValue(true);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await acceptRequest(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});

describe('ignoreRequest', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если chatId невалидный', async () => {
        const req = { user: { user_id: 1 }, params: { chatId: 'xyz' } };
        const res = makeRes();

        await ignoreRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid chat ID' });
    });

    it('возвращает 404 если запрос не найден', async () => {
        ignoreChatRequest.mockResolvedValue(false);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await ignoreRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Request not found or already handled' });
    });

    it('успешно игнорирует запрос', async () => {
        ignoreChatRequest.mockResolvedValue(true);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await ignoreRequest(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});

describe('deleteChatController', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если chatId невалидный', async () => {
        const req = { user: { user_id: 1 }, params: { chatId: 'bad' } };
        const res = makeRes();

        await deleteChatController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid chat ID' });
    });

    it('возвращает 404 если чат не найден', async () => {
        deleteChat.mockResolvedValue(false);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await deleteChatController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Chat not found' });
    });

    it('успешно удаляет чат', async () => {
        deleteChat.mockResolvedValue(true);

        const req = { user: { user_id: 1 }, params: { chatId: '5' } };
        const res = makeRes();

        await deleteChatController(req, res);

        expect(deleteChat).toHaveBeenCalledWith(5, 1);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});