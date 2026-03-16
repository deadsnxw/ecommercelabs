import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/db.js', () => ({
    pool: { query: vi.fn() },
}));

import { pool } from '../../src/db/db.js';
import {
    createVideo,
    getVideoById,
    getUserVideos,
    getAllPublicVideos,
    incrementViewCount,
    updateVideo,
    deleteVideo,
    recordVideoView,
    getVideoTags,
    getOrCreateTag,
    replaceVideoTags,
    getPopularTags,
    searchVideos,
} from '../../src/db/video.repository.js';

beforeEach(() => {
    vi.resetAllMocks();
});


describe('createVideo', () => {
    it('создаёт видео без тегов', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1, title: 'Test' }] })
            .mockResolvedValueOnce({ rows: [] });

        const result = await createVideo({
            userId: 1, title: 'Test', description: '', videoUrl: 'http://url',
            thumbnailUrl: null, duration: null, fileSize: 1000, mimeType: 'video/mp4',
        });

        expect(result.video_id).toBe(1);
        expect(result.tags).toEqual([]);
    });

    it('создаёт видео с тегами', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1, title: 'Test' }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await createVideo({
            userId: 1, title: 'Test', description: '', videoUrl: 'http://url',
            thumbnailUrl: null, duration: null, fileSize: 1000, mimeType: 'video/mp4',
            tags: ['react'],
        });

        expect(result.video_id).toBe(1);
        expect(result.tags).toBeDefined();
    });
});

describe('getVideoById', () => {
    it('возвращает null если видео не найдено', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await getVideoById(999);

        expect(result).toBeNull();
    });

    it('возвращает видео с тегами', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1, title: 'Test' }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await getVideoById(1);

        expect(result.video_id).toBe(1);
        expect(result.tags).toEqual([{ tag_id: 1, name: 'react' }]);
    });
});

describe('getUserVideos', () => {
    it('возвращает только публичные видео если includePrivate=false', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getUserVideos(1, false);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_public = true'),
            [1]
        );
    });

    it('не добавляет фильтр is_public если includePrivate=true', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getUserVideos(1, true);

        const callArg = pool.query.mock.calls[0][0];
        expect(callArg).not.toContain('is_public = true');
    });

    it('добавляет теги к каждому видео', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1 }, { video_id: 2 }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 2, name: 'node' }] });

        const result = await getUserVideos(1, true);

        expect(result[0].tags).toEqual([{ tag_id: 1, name: 'react' }]);
        expect(result[1].tags).toEqual([{ tag_id: 2, name: 'node' }]);
    });
});

describe('getAllPublicVideos', () => {
    it('возвращает публичные видео с пагинацией', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getAllPublicVideos(10, 5);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_public = true'),
            [10, 5]
        );
    });

    it('добавляет теги к каждому видео', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1 }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'js' }] });

        const result = await getAllPublicVideos(20, 0);

        expect(result[0].tags).toEqual([{ tag_id: 1, name: 'js' }]);
    });
});

describe('incrementViewCount', () => {
    it('инкрементирует счётчик и возвращает новое значение', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ views_count: 42 }] });

        const result = await incrementViewCount(1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('views_count = views_count + 1'),
            [1]
        );
        expect(result).toEqual({ views_count: 42 });
    });
});

describe('updateVideo', () => {
    it('бросает ошибку если нет полей для обновления', async () => {
        await expect(updateVideo(1, 1, {})).rejects.toThrow('No fields to update');
    });

    it('обновляет только разрешённые поля', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ video_id: 1, title: 'New' }] });

        const result = await updateVideo(1, 1, { title: 'New', unknownField: 'ignored' });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE videos'),
            expect.arrayContaining(['New', 1, 1])
        );
        expect(result).toEqual({ video_id: 1, title: 'New' });
    });

    it('обновляет is_public', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ video_id: 1, is_public: false }] });

        await updateVideo(1, 1, { is_public: false });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_public'),
            expect.arrayContaining([false, 1, 1])
        );
    });
});

describe('deleteVideo', () => {
    it('помечает видео как неактивное', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ video_id: 1 }] });

        const result = await deleteVideo(1, 1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_active = false'),
            [1, 1]
        );
        expect(result).toEqual({ video_id: 1 });
    });

    it('возвращает undefined если видео не найдено', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await deleteVideo(999, 1);

        expect(result).toBeUndefined();
    });
});

describe('recordVideoView', () => {
    it('записывает просмотр и возвращает view_id', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ view_id: 5 }] });

        const result = await recordVideoView(1, 2, '127.0.0.1', 30);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO video_views'),
            [1, 2, '127.0.0.1', 30]
        );
        expect(result).toEqual({ view_id: 5 });
    });

    it('записывает анонимный просмотр (userId=null)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ view_id: 6 }] });

        await recordVideoView(1, null, '127.0.0.1', 10);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            [1, null, '127.0.0.1', 10]
        );
    });
});

describe('getVideoTags', () => {
    it('возвращает теги видео', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await getVideoTags(1);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('video_tags'),
            [1]
        );
        expect(result).toEqual([{ tag_id: 1, name: 'react' }]);
    });

    it('возвращает пустой массив если тегов нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await getVideoTags(1);

        expect(result).toEqual([]);
    });
});

describe('getOrCreateTag', () => {
    it('возвращает существующий тег', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await getOrCreateTag('React');

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['react']);
        expect(result).toEqual({ tag_id: 1, name: 'react' });
    });

    it('создаёт новый тег если не существует', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 2, name: 'node' }] });

        const result = await getOrCreateTag('Node');

        expect(result).toEqual({ tag_id: 2, name: 'node' });
    });

    it('нормализует имя тега в lowercase', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ tag_id: 3, name: 'javascript' }] });

        await getOrCreateTag('  JavaScript  ');

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['javascript']);
    });
});

describe('replaceVideoTags', () => {
    it('удаляет старые теги и возвращает пустой массив если новых нет', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await replaceVideoTags(1, []);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM video_tags'),
            [1]
        );
        expect(result).toEqual([]);
    });

    it('заменяет теги новыми', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await replaceVideoTags(1, ['react']);

        expect(pool.query).toHaveBeenNthCalledWith(1,
            expect.stringContaining('DELETE FROM video_tags'),
            [1]
        );
        expect(result).toBeDefined();
    });
});

describe('getPopularTags', () => {
    it('возвращает популярные теги', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react', video_count: 5 }] });

        const result = await getPopularTags(10);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [10]);
        expect(result).toEqual([{ tag_id: 1, name: 'react', video_count: 5 }]);
    });

    it('ограничивает лимит до 50', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getPopularTags(999);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [50]);
    });

    it('устанавливает минимальный лимит 1', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await getPopularTags(0);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });
});

describe('searchVideos', () => {
    it('возвращает все публичные видео если query пустой', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await searchVideos('', 20, 0);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('is_public = true'),
            [20, 0]
        );
    });

    it('выполняет поиск по запросу', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ video_id: 1, title: 'React tutorial' }] })
            .mockResolvedValueOnce({ rows: [{ tag_id: 1, name: 'react' }] });

        const result = await searchVideos('react', 20, 0);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('similarity'),
            ['react', 20, 0]
        );
        expect(result[0].tags).toBeDefined();
    });
});