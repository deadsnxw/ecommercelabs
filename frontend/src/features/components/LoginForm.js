import { useState } from "react";
import { authService } from "../../services/authService";

function LoginForm({ onSuccess, onError }) {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await authService.login(formData);
      onSuccess?.(user);
    } catch (err) {
      onError?.(err.message);
    }
  };

  return (
    <form id="login-form" onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <input
          type="text"
          id="login"
          name="login"
          value={formData.login}
          onChange={handleChange}
          placeholder="Пошта або нікнейм"
          required
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Пароль"
          required
        />
      </div>
    </form>
  );
}

export default LoginForm;