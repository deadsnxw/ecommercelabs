import { useState } from "react";
import { fetchAPI } from "../../services/api";

export default function ResetPassword({ email, code }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setMessage("");
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Паролі не співпадають");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Пароль повинен містити принаймні 6 символів");
      return;
    }

    setLoading(true);

    try {
      const data = await fetchAPI("/auth/password-reset/reset", {
        method: "POST",
        body: { email, code, newPassword },
      });
      setMessage(data.message);
      setIsError(false);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className={isError ? "password-reset-error" : "password-reset-success"}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="password-reset-form">
        <div className="password-reset-form-group">
          <input
            type="password"
            placeholder="Мінімум 6 символів"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="password-reset-input"
          />
        </div>

        <div className="password-reset-form-group">
          <input
            type="password"
            placeholder="Повторіть пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="password-reset-input"
          />
          {passwordError && (
            <span className="password-reset-field-error">{passwordError}</span>
          )}
        </div>

        <div className="password-reset-actions">
          <button type="submit" disabled={loading} className="password-reset-submit-btn">
            {loading ? "Встановлюємо..." : "Встановити пароль"}
          </button>
        </div>
      </form>
    </>
  );
}