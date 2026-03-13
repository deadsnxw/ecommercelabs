import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, checkEmail, checkNickname } from '../../src/controllers/AuthController.js';

vi.mock('../../src/db/user.repository.js', () => ({
    findUserByEmail: vi.fn(),
    findUserByNickname: vi.fn(),
    findUserByEmailOrNickname: vi.fn(),
    createUser: vi.fn(),
}));

vi.mock('../../src/utils/auth.utils.js', () => ({
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    generateToken: vi.fn(),
}));

import {
    findUserByEmail,
    findUserByNickname,
    findUserByEmailOrNickname,
    createUser,
} from '../../src/db/user.repository.js';

import { hashPassword, comparePassword, generateToken } from '../../src/utils/auth.utils.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('register', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если не все поля переданы', async () => {
        const req = { body: { nickname: 'test', email: 'test@test.com' } };
        const res = makeRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    it('возвращает 400 если пароль короче 6 символов', async () => {
        const req = { body: { nickname: 'test', email: 'test@test.com', password: '123', birthday: '2000-01-01' } };
        const res = makeRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
    });

    it('возвращает 400 если email уже занят', async () => {
        findUserByEmail.mockResolvedValue({ email: 'test@test.com' });

        const req = { body: { nickname: 'test', email: 'test@test.com', password: '123456', birthday: '2000-01-01' } };
        const res = makeRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });

    it('возвращает 400 если nickname уже занят', async () => {
        findUserByEmail.mockResolvedValue(null);
        findUserByNickname.mockResolvedValue({ nickname: 'test' });

        const req = { body: { nickname: 'test', email: 'test@test.com', password: '123456', birthday: '2000-01-01' } };
        const res = makeRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nickname already exists' });
    });

    it('успешная регистрация — возвращает user и token', async () => {
        findUserByEmail.mockResolvedValue(null);
        findUserByNickname.mockResolvedValue(null);
        hashPassword.mockResolvedValue('hashed_password');
        createUser.mockResolvedValue({
            user_id: 1,
            nickname: 'deadsnxw',
            email: 'test@test.com',
            birth_date: '2000-01-01',
        });
        generateToken.mockReturnValue('jwt_token');

        const req = { body: { nickname: 'deadsnxw', email: 'test@test.com', password: '123456', birthday: '2000-01-01' } };
        const res = makeRes();

        await register(req, res);

        expect(res.json).toHaveBeenCalledWith({
            user: { user_id: 1, nickname: 'deadsnxw', email: 'test@test.com', birthday: '2000-01-01' },
            token: 'jwt_token',
        });
    });

    it('возвращает 500 при ошибке БД', async () => {
        findUserByEmail.mockRejectedValue(new Error('DB error'));

        const req = { body: { nickname: 'test', email: 'test@test.com', password: '123456', birthday: '2000-01-01' } };
        const res = makeRes();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Registration failed', error: 'DB error' });
    });
});

describe('login', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если login или password не переданы', async () => {
        const req = { body: { login: 'test@test.com' } };
        const res = makeRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Login and password are required' });
    });

    it('возвращает 401 если пользователь не найден', async () => {
        findUserByEmailOrNickname.mockResolvedValue(null);

        const req = { body: { login: 'unknown@test.com', password: '123456' } };
        const res = makeRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid login or password' });
    });

    it('возвращает 401 если пароль неверный', async () => {
        findUserByEmailOrNickname.mockResolvedValue({ password_hash: 'hashed' });
        comparePassword.mockResolvedValue(false);

        const req = { body: { login: 'test@test.com', password: 'wrongpass' } };
        const res = makeRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid login or password' });
    });

    it('успешный логин — возвращает user и token', async () => {
        findUserByEmailOrNickname.mockResolvedValue({
            user_id: 1,
            nickname: 'deadsnxw',
            email: 'test@test.com',
            birth_date: '2000-01-01',
            password_hash: 'hashed',
        });
        comparePassword.mockResolvedValue(true);
        generateToken.mockReturnValue('jwt_token');

        const req = { body: { login: 'test@test.com', password: '123456' } };
        const res = makeRes();

        await login(req, res);

        expect(res.json).toHaveBeenCalledWith({
            user: { user_id: 1, nickname: 'deadsnxw', email: 'test@test.com', birthday: '2000-01-01' },
            token: 'jwt_token',
        });
    });

    it('возвращает 500 при ошибке БД', async () => {
        findUserByEmailOrNickname.mockRejectedValue(new Error('DB error'));

        const req = { body: { login: 'test@test.com', password: '123456' } };
        const res = makeRes();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Login failed', error: 'DB error' });
    });
});

describe('checkEmail', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если email не передан', async () => {
        const req = { body: {} };
        const res = makeRes();

        await checkEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('возвращает exists: true если email занят', async () => {
        findUserByEmail.mockResolvedValue({ email: 'test@test.com' });

        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await checkEmail(req, res);

        expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    it('возвращает exists: false если email свободен', async () => {
        findUserByEmail.mockResolvedValue(null);

        const req = { body: { email: 'free@test.com' } };
        const res = makeRes();

        await checkEmail(req, res);

        expect(res.json).toHaveBeenCalledWith({ exists: false });
    });
});

describe('checkNickname', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если nickname не передан', async () => {
        const req = { body: {} };
        const res = makeRes();

        await checkNickname(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nickname is required' });
    });

    it('возвращает exists: true если nickname занят', async () => {
        findUserByNickname.mockResolvedValue({ nickname: 'deadsnxw' });

        const req = { body: { nickname: 'deadsnxw' } };
        const res = makeRes();

        await checkNickname(req, res);

        expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    it('возвращает exists: false если nickname свободен', async () => {
        findUserByNickname.mockResolvedValue(null);

        const req = { body: { nickname: 'freenick' } };
        const res = makeRes();

        await checkNickname(req, res);

        expect(res.json).toHaveBeenCalledWith({ exists: false });
    });
});