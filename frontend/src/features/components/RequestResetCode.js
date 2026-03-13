import { useState } from "react";
import { fetchAPI } from "../../services/api";

export default function RequestResetCode({ onNext }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = await fetchAPI("/auth/password-reset/request", {
        method: "POST",
        body: { email },
      });
      setMessage(data.message);
      setIsError(false);
      if (onNext) {
        onNext(email);
      }
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
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="password-reset-input"
          />
        </div>

        <div className="password-reset-actions">
          <button type="submit" disabled={loading} className="password-reset-submit-btn">
            {loading ? "Надсилаємо..." : "Надіслати код"}
          </button>
        </div>
      </form>
    </>
  );
}