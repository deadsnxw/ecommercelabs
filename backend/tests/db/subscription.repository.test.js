import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    subscribe,
    unsubscribe,
    isSubscribed,
    getUserSubscriptions,
    getSubscribedVideos,
} from '../../src/db/subscription.repository.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('subscribe', () => {
    it('создаёт подписку и возвращает её', async () => {
        const fakeSub = { subscription_id: 1, subscriber_id: 1, channel_id: 2 };
        pool.query.mockResolvedValueOnce({ rows: [fakeSub] });

        const result = await subscribe(1, 2);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO subscriptions'),
            [1, 2]
        );
        expect(result).toEqual(fakeSub);
    });

    it('возвращает null если подписка уже существует (ON CONFLICT DO NOTHING)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await subscribe(1, 2);

        expect(result).toBeNull();
    });
});

describe('unsubscribe', () => {
    it('удаляет подписку и возвращает её', async () => {
        const fakeSub = { subscription_id: 1 };
        pool.query.mockResolvedValueOnce({ rows: [fakeSub] });

        const result = await unsubscribe(1, 2);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM subscriptions'),
            [1, 2]
        );
        expect(result).toEqual(fakeSub);
    });

    it('возвращает null если подписки не было', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await unsubscribe(1, 99);

        expect(result).toBeNull();
    });
});

describe('isSubscribed', () => {
    it('возвращает true если подписка существует', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ subscription_id: 1 }] });

        const result = await isSubscribed(1, 2);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 2]);
        expect(result).toBe(true);
    });

    it('возвращает false если подписки нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await isSubscribed(1, 2);

        expect(result).toBe(false);
    });
});

describe('getUserSubscriptions', () => {
    it('возвращает список подписок с данными канала', async () => {
        const fakeSubs = [
            { channel_id: 2, nickname: 'streamer1', avatar_url: '/avatars/1.jpg' },
            { channel_id: 3, nickname: 'streamer2', avatar_url: null },
        ];
        pool.query.mockResolvedValueOnce({ rows: fakeSubs });

        const result = await getUserSubscriptions(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(fakeSubs);
    });

    it('возвращает пустой массив если подписок нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await getUserSubscriptions(1);

        expect(result).toEqual([]);
    });
});

describe('getSubscribedVideos', () => {
    it('возвращает видео из подписок с дефолтной пагинацией', async () => {
        const fakeVideos = [{ video_id: 1, title: 'Test' }];
        pool.query.mockResolvedValueOnce({ rows: fakeVideos });

        const result = await getSubscribedVideos(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 20, 0]);
        expect(result).toEqual(fakeVideos);
    });

    it('возвращает видео с кастомной пагинацией', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getSubscribedVideos(1, 5, 10);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 5, 10]);
    });

    it('возвращает только публичные и активные видео', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getSubscribedVideos(1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_public = true'),
            expect.any(Array)
        );
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_active = true'),
            expect.any(Array)
        );
    });

    it('возвращает пустой массив если нет видео', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await getSubscribedVideos(99);

        expect(result).toEqual([]);
    });
});