import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    findUserByEmailOrNickname,
    findUserByEmail,
    findUserByNickname,
    searchUsersByNickname,
    getAllUsers,
    getRecommendedUsersForSubscriber,
    getUserById,
    updateUser,
    createUser,
} from '../../src/db/user.repository.js';

const mockQuery = (rows) => pool.query.mockResolvedValue({ rows });

describe('findUserByEmailOrNickname', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя если найден', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com' };
        mockQuery([fakeUser]);

        const result = await findUserByEmailOrNickname('test@test.com');

        expect(pool.query).toHaveBeenCalledOnce();
        expect(result).toEqual(fakeUser);
    });

    it('возвращает undefined если не найден', async () => {
        mockQuery([]);

        const result = await findUserByEmailOrNickname('nobody@test.com');

        expect(result).toBeUndefined();
    });
});

describe('findUserByEmail', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя по email', async () => {
        const fakeUser = { user_id: 2, email: 'hello@test.com' };
        mockQuery([fakeUser]);

        const result = await findUserByEmail('hello@test.com');

        expect(result).toEqual(fakeUser);
    });

    it('возвращает undefined если email не найден', async () => {
        mockQuery([]);

        const result = await findUserByEmail('ghost@test.com');

        expect(result).toBeUndefined();
    });
});

describe('findUserByNickname', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя по nickname', async () => {
        const fakeUser = { user_id: 3, nickname: 'deadsnxw' };
        mockQuery([fakeUser]);

        const result = await findUserByNickname('deadsnxw');

        expect(result).toEqual(fakeUser);
    });

    it('возвращает undefined если nickname не найден', async () => {
        mockQuery([]);

        const result = await findUserByNickname('nobody');

        expect(result).toBeUndefined();
    });
});

describe('searchUsersByNickname', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пустой массив если query пустой', async () => {
        const result = await searchUsersByNickname('');

        expect(pool.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('возвращает пустой массив если query только пробелы', async () => {
        const result = await searchUsersByNickname('   ');

        expect(pool.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('выполняет запрос с ILIKE паттерном', async () => {
        const fakeUsers = [{ user_id: 1, nickname: 'deadsnxw' }];
        mockQuery(fakeUsers);

        const result = await searchUsersByNickname('dead', 10);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ILIKE'),
            ['%dead%', 10]
        );
        expect(result).toEqual(fakeUsers);
    });

    it('ограничивает лимит до 50', async () => {
        mockQuery([]);

        await searchUsersByNickname('test', 999);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            expect.arrayContaining([50])
        );
    });

    it('устанавливает минимальный лимит 1', async () => {
        mockQuery([]);

        await searchUsersByNickname('test', 0);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            expect.arrayContaining([1])
        );
    });
});

describe('getAllUsers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает список всех активных пользователей', async () => {
        const fakeUsers = [{ user_id: 1 }, { user_id: 2 }];
        mockQuery(fakeUsers);

        const result = await getAllUsers();

        expect(pool.query).toHaveBeenCalledOnce();
        expect(result).toEqual(fakeUsers);
    });
});

describe('getRecommendedUsersForSubscriber', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает рекомендованных пользователей', async () => {
        const fakeUsers = [{ user_id: 5, nickname: 'streamer' }];
        mockQuery(fakeUsers);

        const result = await getRecommendedUsersForSubscriber(1, 5);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            [1, 5]
        );
        expect(result).toEqual(fakeUsers);
    });

    it('ограничивает лимит до 10', async () => {
        mockQuery([]);

        await getRecommendedUsersForSubscriber(1, 999);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            [1, 10]
        );
    });
});

describe('getUserById', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя по id', async () => {
        const fakeUser = { user_id: 1, nickname: 'deadsnxw' };
        mockQuery([fakeUser]);

        const result = await getUserById(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(fakeUser);
    });

    it('возвращает undefined если не найден', async () => {
        mockQuery([]);

        const result = await getUserById(999);

        expect(result).toBeUndefined();
    });
});

describe('updateUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя без запроса UPDATE если data пустой', async () => {
        const fakeUser = { user_id: 1, nickname: 'deadsnxw' };
        mockQuery([fakeUser]);

        const result = await updateUser(1, {});

        expect(pool.query).toHaveBeenCalledOnce();
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(fakeUser);
    });

    it('выполняет UPDATE с переданными полями', async () => {
        const updatedUser = { user_id: 1, nickname: 'newnick', bio: 'hello' };
        mockQuery([updatedUser]);

        const result = await updateUser(1, { nickname: 'newnick', bio: 'hello' });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE users'),
            ['newnick', 'hello', 1]
        );
        expect(result).toEqual(updatedUser);
    });
});

describe('createUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('создаёт пользователя и возвращает его данные', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com', nickname: 'deadsnxw', birth_date: '2000-01-01' };
        mockQuery([fakeUser]);

        const result = await createUser({
            email: 'test@test.com',
            nickname: 'deadsnxw',
            passwordHash: 'hashed',
            birthDate: '2000-01-01',
        });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO users'),
            ['test@test.com', 'deadsnxw', 'hashed', '2000-01-01']
        );
        expect(result).toEqual(fakeUser);
    });
});