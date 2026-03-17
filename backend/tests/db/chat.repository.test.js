import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    findChatBetweenUsers,
    createChat,
    findUserChatsWithLastMessage,
    findUserChatRequests,
    acceptChatRequest,
    ignoreChatRequest,
    deleteChat,
} from '../../src/db/chat.repository.js';

beforeEach(() => {
    vi.resetAllMocks();
});


describe('findChatBetweenUsers', () => {
    it('возвращает чат если найден', async () => {
        const fakeChat = { chat_id: 1, user1_id: 1, user2_id: 2 };
        pool.query.mockResolvedValueOnce({ rows: [fakeChat] });

        const result = await findChatBetweenUsers(1, 2);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 2]);
        expect(result).toEqual(fakeChat);
    });

    it('возвращает null если чат не найден', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await findChatBetweenUsers(1, 2);

        expect(result).toBeNull();
    });

    it('нормализует порядок userId (min/max)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await findChatBetweenUsers(5, 2);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [2, 5]);
    });
});


describe('createChat', () => {
    it('создаёт чат с requestedById', async () => {
        const fakeChat = { chat_id: 10, user1_id: 1, user2_id: 2, status: 'pending' };
        pool.query.mockResolvedValueOnce({ rows: [fakeChat] });

        const result = await createChat(1, 2, 1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO chats'),
            [1, 2, 1]
        );
        expect(result).toEqual(fakeChat);
    });

    it('нормализует порядок userId (min/max)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{}] });

        await createChat(5, 2, 5);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [2, 5, 5]);
    });

    it('использует user2 как requestedBy если requestedById=null', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{}] });

        await createChat(1, 2, null);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 2, 2]);
    });
});

describe('findUserChatsWithLastMessage', () => {
    it('возвращает чаты с последним сообщением', async () => {
        const fakeChats = [
            { chat_id: 1, nickname: 'alice', last_message: 'hello' },
            { chat_id: 2, nickname: 'bob', last_message: null },
        ];
        pool.query.mockResolvedValueOnce({ rows: fakeChats });

        const result = await findUserChatsWithLastMessage(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(fakeChats);
    });

    it('возвращает пустой массив если чатов нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await findUserChatsWithLastMessage(99);

        expect(result).toEqual([]);
    });
});

describe('findUserChatRequests', () => {
    it('возвращает входящие запросы на чат', async () => {
        const fakeRequests = [{ chat_id: 3, nickname: 'charlie' }];
        pool.query.mockResolvedValueOnce({ rows: fakeRequests });

        const result = await findUserChatRequests(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(fakeRequests);
    });

    it('возвращает пустой массив если запросов нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await findUserChatRequests(1);

        expect(result).toEqual([]);
    });
});

describe('acceptChatRequest', () => {
    it('возвращает true если запрос принят', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });

        const result = await acceptChatRequest(5, 1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("status = 'approved'"),
            [5, 1]
        );
        expect(result).toBe(true);
    });

    it('возвращает false если запрос не найден', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0 });

        const result = await acceptChatRequest(99, 1);

        expect(result).toBe(false);
    });
});

describe('ignoreChatRequest', () => {
    it('возвращает true если запрос удалён', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });

        const result = await ignoreChatRequest(5, 1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM chats'),
            [5, 1]
        );
        expect(result).toBe(true);
    });

    it('возвращает false если запрос не найден', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0 });

        const result = await ignoreChatRequest(99, 1);

        expect(result).toBe(false);
    });
});

describe('deleteChat', () => {
    it('возвращает true если чат удалён', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });

        const result = await deleteChat(5, 1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM chats'),
            [5, 1]
        );
        expect(result).toBe(true);
    });

    it('возвращает false если чат не найден', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0 });

        const result = await deleteChat(99, 1);

        expect(result).toBe(false);
    });
});