import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    createMessage,
    getChatMessages,
} from '../../src/db/message.repository.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('createMessage', () => {
    it('создаёт сообщение и возвращает его', async () => {
        const fakeMessage = { message_id: 1, chat_id: 5, sender_id: 1, text: 'hello' };
        pool.query.mockResolvedValueOnce({ rows: [fakeMessage] });

        const result = await createMessage({ chatId: 5, senderId: 1, text: 'hello' });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO messages'),
            [5, 1, 'hello']
        );
        expect(result).toEqual(fakeMessage);
    });
});

describe('getChatMessages', () => {
    it('возвращает сообщения чата в хронологическом порядке', async () => {
        const fakeMessages = [
            { message_id: 1, text: 'first' },
            { message_id: 2, text: 'second' },
        ];
        pool.query.mockResolvedValueOnce({ rows: fakeMessages });

        const result = await getChatMessages(5);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY created_at ASC'),
            [5]
        );
        expect(result).toEqual(fakeMessages);
    });

    it('возвращает пустой массив если сообщений нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await getChatMessages(99);

        expect(result).toEqual([]);
    });
});