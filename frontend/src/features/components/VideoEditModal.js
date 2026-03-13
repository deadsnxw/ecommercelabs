import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../services/api';

const DESC_LIMIT = 50;

const VideoEditModal = ({ video_id, video, onClose, onUpdate, onDelete }) => {
    const [title,       setTitle      ] = useState(video?.title || '');
    const [description, setDescription] = useState(video?.description || '');
    const [isPublic,    setIsPublic   ] = useState(video?.is_public !== false);
    const [tags,        setTags       ] = useState(video?.tags?.map(t => t.name).join(', ') || '');
    const [thumbnail,   setThumbnail  ] = useState(null);
    const [loading,     setLoading    ] = useState(false);
    const [error,       setError      ] = useState('');

    if (!video_id) {
        console.error('CRITICAL: video_id is not provided!', { video_id, video });
    }

    useEffect(() => {
        if (video) {
            setTitle(video.title || '');
            setDescription(video.description || '');
            setIsPublic(video.is_public !== false);
            setTags(video.tags?.map(t => t.name).join(', ') || '');
        }
    }, [video]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!video_id) {
            setError('Помилка: ID відео не визначено');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('isPublic', isPublic);
            if (tags.trim()) formData.append('tags', tags);
            if (thumbnail)   formData.append('thumbnail', thumbnail);

            const updated = await fetchAPI(`/videos/${video_id}`, {
                method: 'PUT',
                body: formData,
            });

            onUpdate?.(updated.video);
            onClose();
        } catch (err) {
            setError(err.message || 'Не вдалося оновити відео');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!video_id) {
            setError('Помилка: ID відео не визначено');
            return;
        }

        if (!window.confirm('Ви впевнені, що хочете видалити це відео? Цю дію неможливо скасувати.')) {
            return;
        }

        setLoading(true);
        try {
            await fetchAPI(`/videos/${video_id}`, { method: 'DELETE' });
            onDelete?.(video_id);
            onClose();
        } catch (err) {
            setError(err.message || 'Не вдалося видалити відео');
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '90%',
                    maxWidth: '600px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'none', border: 'none',
                        fontSize: '24px', color: '#666', cursor: 'pointer',
                    }}
                >
                    &times;
                </button>

                <h2 style={{ marginTop: 0 }}>Редагувати відео</h2>

                {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

                <form onSubmit={handleSubmit}>

                    {/* Заголовок */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Заголовок:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc',
                                     borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                            placeholder="Введіть заголовок відео"
                        />
                    </div>

                    {/* Опис */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Опис:
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, DESC_LIMIT))}
                            maxLength={DESC_LIMIT}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc',
                                     borderRadius: '4px', minHeight: '100px', fontSize: '14px',
                                     resize: 'vertical', boxSizing: 'border-box' }}
                            placeholder="Опишіть ваше відео (опціонально)"
                        />
                        <p style={{
                            fontSize: '12px', textAlign: 'right', margin: '4px 0 0',
                            color: description.length >= DESC_LIMIT - 50 ? '#dc3545' : '#999',
                        }}>
                            {description.length}/{DESC_LIMIT}
                        </p>
                    </div>

                    {/* Теги */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Теги:
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc',
                                     borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                            placeholder="Введіть теги через кому (наприклад: FPS, MOBA)"
                        />
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                            Теги допоможуть іншим користувачам знайти ваше відео
                        </p>
                    </div>

                    {/* Мініатюра */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Нова мініатюра (опціонально):
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnail(e.target.files[0] || null)}
                            style={{ display: 'block' }}
                        />
                        {thumbnail && (
                            <p style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                                ✓ {thumbnail.name}
                            </p>
                        )}
                    </div>

                    {/* Публічне */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            <span>Публічне відео</span>
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            style={{
                                padding: '10px 20px', backgroundColor: '#dc3545', color: '#fff',
                                border: 'none', borderRadius: '5px', fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Видалити
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '10px 20px', backgroundColor: '#ccc', color: '#000',
                                border: 'none', borderRadius: '5px', fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 20px', color: '#fff', border: 'none',
                                borderRadius: '5px', fontSize: '14px',
                                backgroundColor: loading ? '#ccc' : '#6441A5',
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default VideoEditModal;