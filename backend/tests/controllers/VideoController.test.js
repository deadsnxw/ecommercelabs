import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    uploadVideo,
    getVideo,
    getPublicVideos,
    getMyVideos,
    getUserVideosList,
    updateVideoDetails,
    deleteVideoById,
    recordWatch,
    searchVideosController,
    getPopularTagsController,
} from '../../src/controllers/VideoController.js';

vi.mock('../../src/db/video.repository.js', () => ({
    createVideo: vi.fn(),
    getVideoById: vi.fn(),
    getUserVideos: vi.fn(),
    getAllPublicVideos: vi.fn(),
    incrementViewCount: vi.fn(),
    updateVideo: vi.fn(),
    deleteVideo: vi.fn(),
    recordVideoView: vi.fn(),
    searchVideos: vi.fn(),
    getPopularTags: vi.fn(),
    replaceVideoTags: vi.fn(),
    getVideoTags: vi.fn(),
}));

import {
    createVideo,
    getVideoById,
    getUserVideos,
    getAllPublicVideos,
    incrementViewCount,
    updateVideo,
    deleteVideo,
    recordVideoView,
    searchVideos,
    getPopularTags,
    replaceVideoTags,
    getVideoTags,
} from '../../src/db/video.repository.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.writeHead = vi.fn();
    res.send = vi.fn();
    return res;
};

describe('uploadVideo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если нет видеофайла', async () => {
        const req = { files: {}, body: {}, user: { user_id: 1 } };
        const res = makeRes();

        await uploadVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'No video file uploaded' });
    });

    it('возвращает 400 если нет title', async () => {
        const req = {
            files: { video: [{ filename: 'video.mp4', size: 1000, mimetype: 'video/mp4' }] },
            body: {},
            user: { user_id: 1 },
        };
        const res = makeRes();

        await uploadVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
    });

    it('успешно загружает видео без тегов', async () => {
        const fakeVideo = { video_id: 1, title: 'Test' };
        createVideo.mockResolvedValue(fakeVideo);

        const req = {
            files: { video: [{ filename: 'video.mp4', size: 1000, mimetype: 'video/mp4' }] },
            body: { title: 'Test', description: 'Desc', isPublic: true },
            user: { user_id: 1 },
            protocol: 'http',
            get: vi.fn().mockReturnValue('localhost:5000'),
        };
        const res = makeRes();

        await uploadVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: 'Video uploaded successfully', video: fakeVideo });
    });

    it('успешно загружает видео с тегами строкой', async () => {
        const fakeVideo = { video_id: 1, title: 'Test' };
        createVideo.mockResolvedValue(fakeVideo);

        const req = {
            files: { video: [{ filename: 'video.mp4', size: 1000, mimetype: 'video/mp4' }] },
            body: { title: 'Test', tags: 'react, node, js' },
            user: { user_id: 1 },
            protocol: 'http',
            get: vi.fn().mockReturnValue('localhost:5000'),
        };
        const res = makeRes();

        await uploadVideo(req, res);

        expect(createVideo).toHaveBeenCalledWith(expect.objectContaining({
            tags: ['react', 'node', 'js'],
        }));
    });

    it('возвращает 500 при ошибке БД', async () => {
        createVideo.mockRejectedValue(new Error('DB error'));

        const req = {
            files: { video: [{ filename: 'video.mp4', size: 1000, mimetype: 'video/mp4' }] },
            body: { title: 'Test' },
            user: { user_id: 1 },
            protocol: 'http',
            get: vi.fn().mockReturnValue('localhost:5000'),
        };
        const res = makeRes();

        await uploadVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('getVideo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 404 если видео не найдено', async () => {
        getVideoById.mockResolvedValue(null);

        const req = { params: { id: '99' }, user: null };
        const res = makeRes();

        await getVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Video not found' });
    });

    it('возвращает 403 если видео приватное и юзер чужой', async () => {
        getVideoById.mockResolvedValue({ video_id: 1, is_public: false, user_id: 5 });

        const req = { params: { id: '1' }, user: { user_id: 1 } };
        const res = makeRes();

        await getVideo(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('возвращает видео если публичное', async () => {
        const fakeVideo = { video_id: 1, is_public: true, user_id: 5 };
        getVideoById.mockResolvedValue(fakeVideo);

        const req = { params: { id: '1' }, user: null };
        const res = makeRes();

        await getVideo(req, res);

        expect(res.json).toHaveBeenCalledWith(fakeVideo);
    });

    it('возвращает приватное видео владельцу', async () => {
        const fakeVideo = { video_id: 1, is_public: false, user_id: 1 };
        getVideoById.mockResolvedValue(fakeVideo);

        const req = { params: { id: '1' }, user: { user_id: 1 } };
        const res = makeRes();

        await getVideo(req, res);

        expect(res.json).toHaveBeenCalledWith(fakeVideo);
    });
});

describe('getPublicVideos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает публичные видео с дефолтной пагинацией', async () => {
        const fakeVideos = [{ video_id: 1 }, { video_id: 2 }];
        getAllPublicVideos.mockResolvedValue(fakeVideos);

        const req = { query: {} };
        const res = makeRes();

        await getPublicVideos(req, res);

        expect(getAllPublicVideos).toHaveBeenCalledWith(20, 0);
        expect(res.json).toHaveBeenCalledWith({ videos: fakeVideos, limit: 20, offset: 0 });
    });

    it('возвращает видео с кастомной пагинацией', async () => {
        getAllPublicVideos.mockResolvedValue([]);

        const req = { query: { limit: '5', offset: '10' } };
        const res = makeRes();

        await getPublicVideos(req, res);

        expect(getAllPublicVideos).toHaveBeenCalledWith(5, 10);
    });
});

describe('getMyVideos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает видео текущего пользователя', async () => {
        const fakeVideos = [{ video_id: 1 }];
        getUserVideos.mockResolvedValue(fakeVideos);

        const req = { user: { user_id: 1 } };
        const res = makeRes();

        await getMyVideos(req, res);

        expect(getUserVideos).toHaveBeenCalledWith(1, true);
        expect(res.json).toHaveBeenCalledWith({ videos: fakeVideos });
    });
});

describe('getUserVideosList', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает публичные видео чужого юзера', async () => {
        const fakeVideos = [{ video_id: 2 }];
        getUserVideos.mockResolvedValue(fakeVideos);

        const req = { params: { userId: '5' }, user: { user_id: 1 } };
        const res = makeRes();

        await getUserVideosList(req, res);

        expect(getUserVideos).toHaveBeenCalledWith('5', false);
        expect(res.json).toHaveBeenCalledWith({ videos: fakeVideos });
    });

    it('возвращает все видео включая приватные для владельца', async () => {
        const fakeVideos = [{ video_id: 1 }, { video_id: 2 }];
        getUserVideos.mockResolvedValue(fakeVideos);

        const req = { params: { userId: '1' }, user: { user_id: 1 } };
        const res = makeRes();

        await getUserVideosList(req, res);

        expect(getUserVideos).toHaveBeenCalledWith('1', true);
    });
});

describe('updateVideoDetails', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 404 если видео не найдено', async () => {
        updateVideo.mockResolvedValue(null);

        const req = {
            params: { id: '1' },
            body: { title: 'New Title' },
            user: { user_id: 1 },
            files: {},
        };
        const res = makeRes();

        await updateVideoDetails(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Video not found or access denied' });
    });

    it('успешно обновляет видео без тегов', async () => {
        const fakeVideo = { video_id: 1, title: 'New Title' };
        updateVideo.mockResolvedValue(fakeVideo);
        getVideoTags.mockResolvedValue([]);

        const req = {
            params: { id: '1' },
            body: { title: 'New Title' },
            user: { user_id: 1 },
            files: {},
        };
        const res = makeRes();

        await updateVideoDetails(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: 'Video updated successfully', video: expect.objectContaining({ title: 'New Title' }) });
    });

    it('обновляет теги если переданы', async () => {
        const fakeVideo = { video_id: 1, title: 'Test' };
        updateVideo.mockResolvedValue(fakeVideo);
        replaceVideoTags.mockResolvedValue(['react', 'node']);

        const req = {
            params: { id: '1' },
            body: { title: 'Test', tags: 'react,node' },
            user: { user_id: 1 },
            files: {},
        };
        const res = makeRes();

        await updateVideoDetails(req, res);

        expect(replaceVideoTags).toHaveBeenCalledWith('1', ['react', 'node']);
    });
});

describe('deleteVideoById', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 404 если видео не найдено', async () => {
        deleteVideo.mockResolvedValue(null);

        const req = { params: { id: '1' }, user: { user_id: 1 } };
        const res = makeRes();

        await deleteVideoById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Video not found or access denied' });
    });

    it('успешно удаляет видео', async () => {
        deleteVideo.mockResolvedValue({ video_id: 1 });

        const req = { params: { id: '1' }, user: { user_id: 1 } };
        const res = makeRes();

        await deleteVideoById(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: 'Video deleted successfully' });
    });
});

describe('recordWatch', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает 400 если watchDuration невалидный', async () => {
        const req = { params: { id: '1' }, body: { watchDuration: -1 }, user: null };
        const res = makeRes();

        await recordWatch(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid watch duration' });
    });

    it('возвращает 404 если видео не найдено', async () => {
        getVideoById.mockResolvedValue(null);

        const req = { params: { id: '99' }, body: { watchDuration: 10 }, user: null };
        const res = makeRes();

        await recordWatch(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('засчитывает просмотр если время достаточное (длинное видео)', async () => {
        getVideoById.mockResolvedValue({ video_id: 1, user_id: 5, duration: 300 });
        recordVideoView.mockResolvedValue();
        incrementViewCount.mockResolvedValue();

        const req = {
            params: { id: '1' },
            body: { watchDuration: 30 },
            user: { user_id: 1 },
            ip: '127.0.0.1',
        };
        const res = makeRes();

        await recordWatch(req, res);

        expect(incrementViewCount).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith({ message: 'View counted', counted: true });
    });

    it('не засчитывает просмотр если время недостаточное', async () => {
        getVideoById.mockResolvedValue({ video_id: 1, user_id: 5, duration: 300 });
        recordVideoView.mockResolvedValue();

        const req = {
            params: { id: '1' },
            body: { watchDuration: 5 },
            user: { user_id: 1 },
            ip: '127.0.0.1',
        };
        const res = makeRes();

        await recordWatch(req, res);

        expect(incrementViewCount).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ counted: false }));
    });

    it('не инкрементирует счётчик для владельца видео', async () => {
        getVideoById.mockResolvedValue({ video_id: 1, user_id: 1, duration: 300 });
        recordVideoView.mockResolvedValue();

        const req = {
            params: { id: '1' },
            body: { watchDuration: 60 },
            user: { user_id: 1 },
            ip: '127.0.0.1',
        };
        const res = makeRes();

        await recordWatch(req, res);

        expect(incrementViewCount).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('owner') }));
    });
});

describe('searchVideosController', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает все публичные видео если q пустой', async () => {
        getAllPublicVideos.mockResolvedValue([{ video_id: 1 }]);

        const req = { query: { q: '  ' } };
        const res = makeRes();

        await searchVideosController(req, res);

        expect(getAllPublicVideos).toHaveBeenCalled();
        expect(searchVideos).not.toHaveBeenCalled();
    });

    it('выполняет поиск если q передан', async () => {
        searchVideos.mockResolvedValue([{ video_id: 2 }]);

        const req = { query: { q: 'react', limit: '10', offset: '0' } };
        const res = makeRes();

        await searchVideosController(req, res);

        expect(searchVideos).toHaveBeenCalledWith('react', 10, 0);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ query: 'react' }));
    });
});

describe('getPopularTagsController', () => {
    beforeEach(() => vi.clearAllMocks());

    it('возвращает популярные теги с дефолтным лимитом 10', async () => {
        getPopularTags.mockResolvedValue(['react', 'node', 'js']);

        const req = { query: {} };
        const res = makeRes();

        await getPopularTagsController(req, res);

        expect(getPopularTags).toHaveBeenCalledWith(10);
        expect(res.json).toHaveBeenCalledWith({ tags: ['react', 'node', 'js'] });
    });

    it('возвращает теги с кастомным лимитом', async () => {
        getPopularTags.mockResolvedValue(['react']);

        const req = { query: { limit: '5' } };
        const res = makeRes();

        await getPopularTagsController(req, res);

        expect(getPopularTags).toHaveBeenCalledWith(5);
    });
});