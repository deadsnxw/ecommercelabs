import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    subscribeToUser,
    unsubscribeFromUser,
    getSubscriptionStatus,
    getMySubscriptions,
    getSubscribedFeed,
} from '../../src/controllers/SubscriptionController.js';

vi.mock('../../src/db/subscription.repository.js', () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    isSubscribed: vi.fn(),
    getUserSubscriptions: vi.fn(),
    getSubscribedVideos: vi.fn(),
}));

vi.mock('../../src/db/user.repository.js', () => ({
    getUserById: vi.fn(),
}));

import {
    subscribe,
    unsubscribe,
    isSubscribed,
    getUserSubscriptions,
    getSubscribedVideos,
} from '../../src/db/subscription.repository.js';
import { getUserById } from '../../src/db/user.repository.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('subscribeToUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если channelId не передан', async () => {
        const req = { user: { user_id: 1 }, body: {} };
        const res = makeRes();

        await subscribeToUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'channelId is required' });
    });

    it('возвращает 400 если подписка на себя', async () => {
        const req = { user: { user_id: 1 }, body: { channelId: 1 } };
        const res = makeRes();

        await subscribeToUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'You cannot subscribe to yourself' });
    });

    it('возвращает 404 если канал не найден', async () => {
        getUserById.mockResolvedValue(null);

        const req = { user: { user_id: 1 }, body: { channelId: 99 } };
        const res = makeRes();

        await subscribeToUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('успешно подписывается', async () => {
        getUserById.mockResolvedValue({ user_id: 2, nickname: 'streamer' });
        subscribe.mockResolvedValue({ subscription_id: 10 });

        const req = { user: { user_id: 1 }, body: { channelId: 2 } };
        const res = makeRes();

        await subscribeToUser(req, res);

        expect(subscribe).toHaveBeenCalledWith(1, 2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Subscribed successfully',
            subscribed: true,
            subscription: { subscription_id: 10 },
        });
    });

    it('возвращает 500 при ошибке', async () => {
        getUserById.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, body: { channelId: 2 } };
        const res = makeRes();

        await subscribeToUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to subscribe', error: 'DB error' });
    });
});

describe('unsubscribeFromUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если channelId не передан', async () => {
        const req = { user: { user_id: 1 }, body: {} };
        const res = makeRes();

        await unsubscribeFromUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'channelId is required' });
    });

    it('успешно отписывается', async () => {
        unsubscribe.mockResolvedValue({ subscription_id: 10 });

        const req = { user: { user_id: 1 }, body: { channelId: 2 } };
        const res = makeRes();

        await unsubscribeFromUser(req, res);

        expect(unsubscribe).toHaveBeenCalledWith(1, 2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Unsubscribed successfully',
            subscribed: false,
            removed: true,
        });
    });

    it('возвращает removed: false если подписки не было', async () => {
        unsubscribe.mockResolvedValue(null);

        const req = { user: { user_id: 1 }, body: { channelId: 2 } };
        const res = makeRes();

        await unsubscribeFromUser(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ removed: false }));
    });

    it('возвращает 500 при ошибке', async () => {
        unsubscribe.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, body: { channelId: 2 } };
        const res = makeRes();

        await unsubscribeFromUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to unsubscribe', error: 'DB error' });
    });
});

describe('getSubscriptionStatus', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если channelId не передан', async () => {
        const req = { user: { user_id: 1 }, query: {} };
        const res = makeRes();

        await getSubscriptionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'channelId is required' });
    });

    it('возвращает subscribed: true', async () => {
        isSubscribed.mockResolvedValue(true);

        const req = { user: { user_id: 1 }, query: { channelId: '2' } };
        const res = makeRes();

        await getSubscriptionStatus(req, res);

        expect(isSubscribed).toHaveBeenCalledWith(1, '2');
        expect(res.json).toHaveBeenCalledWith({ subscribed: true });
    });

    it('возвращает subscribed: false', async () => {
        isSubscribed.mockResolvedValue(false);

        const req = { user: { user_id: 1 }, query: { channelId: '2' } };
        const res = makeRes();

        await getSubscriptionStatus(req, res);

        expect(res.json).toHaveBeenCalledWith({ subscribed: false });
    });

    it('возвращает 500 при ошибке', async () => {
        isSubscribed.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, query: { channelId: '2' } };
        const res = makeRes();

        await getSubscriptionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('getMySubscriptions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает список подписок', async () => {
        const fakeSubs = [{ channel_id: 2 }, { channel_id: 3 }];
        getUserSubscriptions.mockResolvedValue(fakeSubs);

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMySubscriptions(req, res);

        expect(getUserSubscriptions).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith({ subscriptions: fakeSubs });
    });

    it('возвращает 500 при ошибке', async () => {
        getUserSubscriptions.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMySubscriptions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('getSubscribedFeed', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает видео с дефолтной пагинацией', async () => {
        const fakeVideos = [{ video_id: 1 }, { video_id: 2 }];
        getSubscribedVideos.mockResolvedValue(fakeVideos);

        const req = { user: { user_id: 1 }, query: {} };
        const res = makeRes();

        await getSubscribedFeed(req, res);

        expect(getSubscribedVideos).toHaveBeenCalledWith(1, 20, 0);
        expect(res.json).toHaveBeenCalledWith({ videos: fakeVideos, limit: 20, offset: 0 });
    });

    it('возвращает видео с кастомной пагинацией', async () => {
        getSubscribedVideos.mockResolvedValue([]);

        const req = { user: { user_id: 1 }, query: { limit: '5', offset: '10' } };
        const res = makeRes();

        await getSubscribedFeed(req, res);

        expect(getSubscribedVideos).toHaveBeenCalledWith(1, 5, 10);
        expect(res.json).toHaveBeenCalledWith({ videos: [], limit: 5, offset: 10 });
    });

    it('возвращает 500 при ошибке', async () => {
        getSubscribedVideos.mockRejectedValue(new Error('DB error'));

        const req = { user: { user_id: 1 }, query: {} };
        const res = makeRes();

        await getSubscribedFeed(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get subscribed videos', error: 'DB error' });
    });
});