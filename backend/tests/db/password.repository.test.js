import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    createResetCode,
    findValidResetCode,
    markResetCodeAsUsed,
    deleteOldResetCodes,
    findResetCodeByHash,
} from '../../src/db/password.repository.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('createResetCode', () => {
    it('создаёт код и возвращает id', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });

        const result = await createResetCode({
            userId: 1,
            codeHash: 'abc123',
            expiresAt: '2026-01-01T00:00:00Z',
        });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO password_reset_codes'),
            [1, 'abc123', '2026-01-01T00:00:00Z']
        );
        expect(result).toEqual({ id: 42 });
    });
});

describe('findValidResetCode', () => {
    it('возвращает валидный код если найден', async () => {
        const fakeCode = { id: 1, user_id: 1, used: false };
        pool.query.mockResolvedValueOnce({ rows: [fakeCode] });

        const result = await findValidResetCode(1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('used = false'),
            [1]
        );
        expect(result).toEqual(fakeCode);
    });

    it('возвращает undefined если нет валидного кода', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await findValidResetCode(1);

        expect(result).toBeUndefined();
    });
});

describe('markResetCodeAsUsed', () => {
    it('помечает код как использованный', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });

        await markResetCodeAsUsed(42);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('SET used = true'),
            [42]
        );
    });
});

describe('deleteOldResetCodes', () => {
    it('удаляет все коды пользователя', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 3 });

        await deleteOldResetCodes(1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM password_reset_codes'),
            [1]
        );
    });
});

describe('findResetCodeByHash', () => {
    it('возвращает код если найден по userId и hash', async () => {
        const fakeCode = { id: 5, user_id: 1, code_hash: 'abc123' };
        pool.query.mockResolvedValueOnce({ rows: [fakeCode] });

        const result = await findResetCodeByHash(1, 'abc123');

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('code_hash = $2'),
            [1, 'abc123']
        );
        expect(result).toEqual(fakeCode);
    });

    it('возвращает undefined если код не найден', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await findResetCodeByHash(1, 'wronghash');

        expect(result).toBeUndefined();
    });

    it('ищет только неиспользованные и не истёкшие коды', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await findResetCodeByHash(1, 'abc123');

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('used = false'),
            expect.any(Array)
        );
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('expires_at > NOW()'),
            expect.any(Array)
        );
    });
});