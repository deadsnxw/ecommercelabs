import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import VerifyCode from "../features/components/VerifyCode";
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

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (!email) {
    navigate("/password-reset");
    return null;
  }

  if (isMobile) {
    return (
      <div className="pr-mobile-container">
        <button className="pr-mobile-back" onClick={() => navigate("/password-reset")}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад
        </button>

        <h1 className="pr-mobile-title">Введіть код</h1>
        <p className="pr-mobile-subtitle">Ми надіслали 6-значний код на {email}</p>

        <VerifyCode
          email={email}
          onVerified={(code) =>
            navigate("/password-reset/new-password", { state: { email, code } })
          }
        />

        <p className="pr-mobile-footer-text">
          <Link to="/password-reset">Назад до відновлення</Link>
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
        <h1 className="password-reset-right-title">Введіть код</h1>
        <VerifyCode
          email={email}
          onVerified={(code) =>
            navigate("/password-reset/new-password", { state: { email, code } })
          }
        />
        <p className="password-reset-back-text">
          <Link to="/password-reset">Назад</Link>
        </p>
      </div>
    </div>
  );
}