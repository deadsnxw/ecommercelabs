import { useState } from 'react';
import { authService } from '../../services/authService';

function RegisterForm({ onSuccess, onError }) {
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        birthday: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await authService.register(formData);
            onSuccess?.(user);
        } catch (err) {
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="Nickname"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                />
            </div>

            <div className="form-group">
                <label htmlFor="birthday">Birthday</label>
                <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Registering...' : 'Register'}
            </button>
        </form>
    );
}

export default RegisterForm;