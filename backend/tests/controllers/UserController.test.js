import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getMe,
    getUser,
    getUsers,
    searchUsersController,
    getRecommendedUsers,
    updateMe,
    uploadMyAvatar,
    uploadMyBanner,
} from '../../src/controllers/UserController.js';

vi.mock('../../src/db/user.repository.js', () => ({
    getUserById: vi.fn(),
    getAllUsers: vi.fn(),
    searchUsersByNickname: vi.fn(),
    getRecommendedUsersForSubscriber: vi.fn(),
    updateUser: vi.fn(),
    findUserByNickname: vi.fn(),
}));

import {
    getUserById,
    getAllUsers,
    searchUsersByNickname,
    getRecommendedUsersForSubscriber,
    updateUser,
    findUserByNickname,
} from '../../src/db/user.repository.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('getMe', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает текущего пользователя', async () => {
        const fakeUser = { user_id: 1, nickname: 'deadsnxw' };
        getUserById.mockResolvedValue(fakeUser);

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMe(req, res);

        expect(getUserById).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith(fakeUser);
    });
});

describe('getUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пользователя по id', async () => {
        const fakeUser = { user_id: 2, nickname: 'someone' };
        getUserById.mockResolvedValue(fakeUser);

        const req = { params: { id: '2' } };
        const res = makeRes();

        await getUser(req, res);

        expect(res.json).toHaveBeenCalledWith(fakeUser);
    });

    it('возвращает 404 если пользователь не найден', async () => {
        getUserById.mockResolvedValue(null);

        const req = { params: { id: '999' } };
        const res = makeRes();

        await getUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
});

describe('getUsers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает список всех пользователей', async () => {
        const fakeUsers = [{ user_id: 1 }, { user_id: 2 }];
        getAllUsers.mockResolvedValue(fakeUsers);

        const req = {};
        const res = makeRes();

        await getUsers(req, res);

        expect(res.json).toHaveBeenCalledWith(fakeUsers);
    });
});

describe('searchUsersController', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает пустой массив если q не передан', async () => {
        const req = { query: {} };
        const res = makeRes();

        await searchUsersController(req, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(searchUsersByNickname).not.toHaveBeenCalled();
    });

    it('возвращает пустой массив если q пустая строка', async () => {
        const req = { query: { q: '   ' } };
        const res = makeRes();

        await searchUsersController(req, res);

        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('возвращает результаты поиска', async () => {
        const fakeUsers = [{ nickname: 'deadsnxw' }];
        searchUsersByNickname.mockResolvedValue(fakeUsers);

        const req = { query: { q: 'dead', limit: 10 } };
        const res = makeRes();

        await searchUsersController(req, res);

        expect(searchUsersByNickname).toHaveBeenCalledWith('dead', 10);
        expect(res.json).toHaveBeenCalledWith(fakeUsers);
    });

    it('возвращает 500 при ошибке', async () => {
        searchUsersByNickname.mockRejectedValue(new Error('DB error'));

        const req = { query: { q: 'dead' } };
        const res = makeRes();

        await searchUsersController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to search users', error: 'DB error' });
    });
});

describe('getRecommendedUsers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает рекомендованных пользователей', async () => {
        const fakeUsers = [{ user_id: 3 }];
        getRecommendedUsersForSubscriber.mockResolvedValue(fakeUsers);

        const req = { user: { user_id: 1 }, query: { limit: 5 } };
        const res = makeRes();

        await getRecommendedUsers(req, res);

        expect(getRecommendedUsersForSubscriber).toHaveBeenCalledWith(1, 5);
        expect(res.json).toHaveBeenCalledWith(fakeUsers);
    });

    it('возвращает 500 при ошибке', async () => {
        getRecommendedUsersForSubscriber.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, query: {} };
        const res = makeRes();

        await getRecommendedUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get recommended users', error: 'DB error' });
    });
});

describe('updateMe', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если nickname пустая строка', async () => {
        const req = { user: { user_id: 1 }, body: { nickname: '   ' } };
        const res = makeRes();

        await updateMe(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nickname is required' });
    });

    it('возвращает 400 если nickname уже занят другим юзером', async () => {
        findUserByNickname.mockResolvedValue({ user_id: 99 });

        const req = { user: { user_id: 1 }, body: { nickname: 'taken' } };
        const res = makeRes();

        await updateMe(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Nickname already exists' });
    });

    it('позволяет оставить тот же nickname (тот же user_id)', async () => {
        findUserByNickname.mockResolvedValue({ user_id: 1 });
        updateUser.mockResolvedValue({ user_id: 1, nickname: 'deadsnxw' });

        const req = { user: { user_id: 1 }, body: { nickname: 'deadsnxw' } };
        const res = makeRes();

        await updateMe(req, res);

        expect(res.json).toHaveBeenCalledWith({ user_id: 1, nickname: 'deadsnxw' });
    });

    it('возвращает 400 если bio превышает 500 символов', async () => {
        const req = { user: { user_id: 1 }, body: { bio: 'a'.repeat(501) } };
        const res = makeRes();

        await updateMe(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Bio must be at most 500 characters' });
    });

    it('успешно обновляет профиль', async () => {
        findUserByNickname.mockResolvedValue(null);
        updateUser.mockResolvedValue({ user_id: 1, nickname: 'newnick', bio: 'hello' });

        const req = { user: { user_id: 1 }, body: { nickname: 'newnick', bio: 'hello' } };
        const res = makeRes();

        await updateMe(req, res);

        expect(updateUser).toHaveBeenCalledWith(1, { nickname: 'newnick', bio: 'hello' });
        expect(res.json).toHaveBeenCalledWith({ user_id: 1, nickname: 'newnick', bio: 'hello' });
    });

    it('возвращает 500 при ошибке', async () => {
        findUserByNickname.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, body: { nickname: 'test' } };
        const res = makeRes();

        await updateMe(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to update profile', error: 'DB error' });
    });
});

describe('uploadMyAvatar', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если файл не передан', async () => {
        const req = { user: { user_id: 1 }, file: null };
        const res = makeRes();

        await uploadMyAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'avatar file is required' });
    });

    it('успешно загружает аватар', async () => {
        updateUser.mockResolvedValue({ user_id: 1, avatar_url: '/uploads/avatars/pic.jpg' });

        const req = { user: { user_id: 1 }, file: { filename: 'pic.jpg' } };
        const res = makeRes();

        await uploadMyAvatar(req, res);

        expect(updateUser).toHaveBeenCalledWith(1, { avatar_url: '/uploads/avatars/pic.jpg' });
        expect(res.json).toHaveBeenCalledWith({ user_id: 1, avatar_url: '/uploads/avatars/pic.jpg' });
    });
});

describe('uploadMyBanner', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если файл не передан', async () => {
        const req = { user: { user_id: 1 }, file: null };
        const res = makeRes();

        await uploadMyBanner(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'banner file is required' });
    });

    it('успешно загружает баннер', async () => {
        updateUser.mockResolvedValue({ user_id: 1, banner_url: '/uploads/banners/banner.jpg' });

        const req = { user: { user_id: 1 }, file: { filename: 'banner.jpg' } };
        const res = makeRes();

        await uploadMyBanner(req, res);

        expect(updateUser).toHaveBeenCalledWith(1, { banner_url: '/uploads/banners/banner.jpg' });
        expect(res.json).toHaveBeenCalledWith({ user_id: 1, banner_url: '/uploads/banners/banner.jpg' });
    });
});