import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import RequestResetCode from "../features/components/RequestResetCode";
import "../styles/PasswordResetPage.css";

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (isMobile) {
    return (
      <div className="pr-mobile-container">
        <button className="pr-mobile-back" onClick={() => navigate("/login")}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад до входу
        </button>

        <h1 className="pr-mobile-title">Відновлення пароля</h1>
        <p className="pr-mobile-subtitle">Введіть email — надішлемо код для відновлення.</p>

        <RequestResetCode
          onNext={(enteredEmail) => {
            setEmail(enteredEmail);
            navigate("/password-reset/verify", { state: { email: enteredEmail } });
          }}
        />

        <p className="pr-mobile-footer-text">
          Пам'ятаєте пароль? <Link to="/login">Увійти</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="passwordResetContainer">
      <div className="password-reset-star-background" />
      <div className="password-reset-left">
        <div className="password-reset-text-content">
          <h1 className="password-reset-main-title">
            Стань<br />частиною<br />живого<br />моменту.
          </h1>
          <p className="password-reset-subtitle">
            Твій простір для живого відео.<br />Разом із мільйонами однодумців.
          </p>
        </div>
      </div>
      <div className="password-reset-right">
        <h1 className="password-reset-right-title">Відновлення пароля</h1>
        <RequestResetCode
          onNext={(enteredEmail) => {
            setEmail(enteredEmail);
            navigate("/password-reset/verify", { state: { email: enteredEmail } });
          }}
        />
        <p className="password-reset-back-text">
          Пам'ятаєте пароль? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}