import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ResetPassword from "../features/components/ResetPassword";
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

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const code = location.state?.code;
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (!email || !code) {
    navigate("/password-reset");
    return null;
  }

  if (isMobile) {
    return (
      <div className="pr-mobile-container">
        <button className="pr-mobile-back" onClick={() => navigate(-1)}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад
        </button>

        <h1 className="pr-mobile-title">Новий пароль</h1>
        <p className="pr-mobile-subtitle">Придумайте новий пароль для вашого акаунту.</p>

        <ResetPassword email={email} code={code} />

        <p className="pr-mobile-footer-text">
          <Link to="/login">Повернутися до входу</Link>
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
        <h1 className="password-reset-right-title">Новий пароль</h1>
        <ResetPassword email={email} code={code} />
        <p className="password-reset-back-text">
          <Link to="/login">Повернутися до входу</Link>
        </p>
      </div>
    </div>
  );
}