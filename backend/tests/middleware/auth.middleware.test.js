import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateToken } from '../../src/middleware/auth.middleware.js';

vi.mock('../../src/utils/auth.utils.js', () => ({
    verifyToken: vi.fn(),
}));

import { verifyToken } from '../../src/utils/auth.utils.js';

const makeReq = (authHeader) => ({
    headers: { authorization: authHeader },
});

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const makeNext = () => vi.fn();

describe('authenticateToken middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('возвращает 401 если заголовок Authorization отсутствует', () => {
        const req = makeReq(undefined);
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('возвращает 401 если токен пустой строкой', () => {
        const req = makeReq('Bearer ');
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('вызывает next() и пишет req.user если токен валидный', () => {
        const fakeUser = { id: 1, username: 'deadsnxw' };
        verifyToken.mockReturnValue(fakeUser);

        const req = makeReq('Bearer valid.token.here');
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('valid.token.here');
        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('возвращает 401 если токен истёк', () => {
        verifyToken.mockImplementation(() => {
            throw new Error('Token expired');
        });

        const req = makeReq('Bearer expired.token');
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
        expect(next).not.toHaveBeenCalled();
    });

    it('возвращает 403 если токен невалидный', () => {
        verifyToken.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const req = makeReq('Bearer invalid.token');
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('возвращает 403 при любой другой ошибке verifyToken', () => {
        verifyToken.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const req = makeReq('Bearer some.token');
        const res = makeRes();
        const next = makeNext();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });
});