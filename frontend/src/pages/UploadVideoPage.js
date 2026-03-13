import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';

const UploadVideoPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!file || !title) {
            setError('Заголовок та відео файл обов\'язкові');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);
        if (tags.trim()) {
            formData.append('tags', tags);
        }
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        try {
            setLoading(true);
            
            const data = await fetchAPI('/videos/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('Upload successful:', data);
            navigate('/profile');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Не вдалося завантажити відео');
            
            if (err.message.includes('401') || err.message.includes('403') || err.message.includes('unauthorized')) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-page" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Завантажити відео</h2>
            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Заголовок:
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        placeholder="Введіть заголовок відео"
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Опис:
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        maxLength={500}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px', fontSize: '14px', resize: 'vertical' }}
                        placeholder="Опишіть ваше відео (опціонально)"
                    />
                    <p style={{ fontSize: '12px', color: description.length >= 450 ? '#dc3545' : '#999', margin: '4px 0 0', textAlign: 'right' }}>
                        {description.length}/500
                    </p>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Теги (опціонально):
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        placeholder="Введіть теги через кому (наприклад: FPS, MOBA, talk)"
                    />
                    <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                        Теги допоможуть іншим користувачам знайти ваше відео
                    </p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Відео файл:
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                        style={{ display: 'block' }}
                    />
                    {file && (
                        <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                            ✓ Вибрано: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Мініатюра (опціонально):
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnail(e.target.files[0] || null)}
                        style={{ display: 'block' }}
                    />
                    {thumbnail && (
                        <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                            ✓ Вибрано мініатюру: {thumbnail.name}
                        </p>
                    )}
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: loading ? '#ccc' : '#6441A5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) e.target.style.backgroundColor = '#7c5dbe';
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) e.target.style.backgroundColor = '#6441A5';
                    }}
                >
                    {loading ? 'Завантаження...' : 'Завантажити відео'}
                </button>
            </form>
        </div>
    );
};

export default UploadVideoPage;