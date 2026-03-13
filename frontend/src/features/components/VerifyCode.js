import { useState, useRef } from "react";
import { fetchAPI } from "../../services/api";

export default function VerifyCode({ email, onVerified }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("").filter(char => /^\d$/.test(char));
    
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });
    setCode(newCode);

    // Focus the next empty input or last input
    const nextEmptyIndex = newCode.findIndex(val => !val);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      setMessage("Введіть повний код");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = await fetchAPI("/auth/password-reset/verify", {
        method: "POST",
        body: { email, code: fullCode },
      });
      setMessage(data.message);
      setIsError(false);
      onVerified(fullCode);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = await fetchAPI("/auth/password-reset/resend", {
        method: "POST",
        body: { email },
      });
      setMessage(data.message);
      setIsError(false);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
          <div className="code-input-container">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="code-input-box"
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        <div className="password-reset-actions">
          <button type="submit" disabled={loading} className="password-reset-submit-btn">
            {loading ? "Перевіряємо..." : "Перевірити код"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="password-reset-resend-btn"
          >
            Надіслати код ще раз
          </button>
        </div>
      </form>
    </>
  );
}