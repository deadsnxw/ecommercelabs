import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

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

export default function LandingPage() {
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [mobileStarted, setMobileStarted] = useState(false);

  return (
    <div className="landing-container">

      {isMobile ? (
        // ===== МОБІЛЬНА ВЕРСІЯ =====
        <div className="mobile-layout">

          {!mobileStarted ? (
            // Початковий екран — зірка + текст + кнопка Розпочати
            <>
              <div className="star-background" />
              <div className="mobile-top" />

              <div className="mobile-content">
                <h1 className="main-title">
                  Стань<br />
                  частиною<br />
                  живого<br />
                  моменту.
                </h1>
                <p className="subtitle">
                  Твій простір для живого відео.<br />
                  Разом із мільйонами однодумців.
                </p>
              </div>

              <div className="mobile-footer">
                <button
                  className="start-button"
                  onClick={() => setMobileStarted(true)}
                >
                  <span>Розпочати</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            // Екран після натискання — новий текст + кнопки авторизації
            <div className="mobile-auth-screen">
              <p className="auth-screen-label">Ми знайшли для вас щось цікаве! Але для початку треба увійти.</p>

              <div className="mobile-auth">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="login-button"
                >
                  Увійти
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="register-button"
                >
                  Реєстрація
                </button>

                <div className="social-buttons">
                  <button className="social-button apple" aria-label="Sign in with Apple">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </button>
                  <button className="social-button discord" aria-label="Sign in with Discord">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </button>
                  <button className="social-button xbox" aria-label="Sign in with Xbox">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536a12.188 12.188 0 0 0-1.088-.98s-.14-.095-.151-.104c-.211-.161-.915.215-1.734 1.047-.821.831-2.199 2.234-2.195 3.196zM8.738 6.627c-.819-.832-1.523-1.208-1.734-1.047-.011.009-.151.104-.151.104-.4.292-.765.617-1.088.98A11.95 11.95 0 0 0 2.195 12c0 2.89 1.029 5.546 2.741 7.621C3.528 17.022 8.512 9.588 11.012 6.627c.004-.962-1.374-2.365-2.195-3.196z"/>
                    </svg>
                  </button>
                  <button className="social-button playstation" aria-label="Sign in with PlayStation">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.794.795.794 1.485v4.688c0 .69.363 1.151.854.991.636-.181.854-.795.854-1.485V5.688c.06-3.075-3.427-4.792-7.211-3.092zm11.695 9.738l-5.205-1.614c-.524-.159-.854.363-.854.85v4.692c.06.731.363 1.131.854.97l5.205-1.614c.463-.181.734-.665.734-1.151 0-.486-.271-.97-.734-1.133zm-17.43 3.264l-.794 2.426c-.06.181-.242.363-.423.363H.303c-.181 0-.242-.181-.242-.363l.181-.666c.06-.181.242-.363.423-.363h3.915c.181 0 .242.181.242.363l-.181.666c-.06.181-.242.363-.423.363h-.733l-.733-2.426h.733z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ===== ДЕСКТОПНА ВЕРСІЯ =====
        <>
          <div className="star-background" />

          <div className="landing-left">
            <div className="text-content">
              <h1 className="main-title">
                Стань<br />
                частиною<br />
                живого<br />
                моменту.
              </h1>
              <p className="subtitle">
                Твій простір для живого відео.<br />
                Разом із мільйонами однодумців.
              </p>
            </div>
          </div>

          <div className="landing-right">
            <div className="auth-buttons">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="login-button"
              >
                Увійти
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="register-button"
              >
                Реєстрація
              </button>
            </div>

            <div className="social-buttons">
              <button className="social-button apple" aria-label="Sign in with Apple">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button className="social-button discord" aria-label="Sign in with Discord">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </button>
              <button className="social-button xbox" aria-label="Sign in with Xbox">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536a12.188 12.188 0 0 0-1.088-.98s-.14-.095-.151-.104c-.211-.161-.915.215-1.734 1.047-.821.831-2.199 2.234-2.195 3.196zM8.738 6.627c-.819-.832-1.523-1.208-1.734-1.047-.011.009-.151.104-.151.104-.4.292-.765.617-1.088.98A11.95 11.95 0 0 0 2.195 12c0 2.89 1.029 5.546 2.741 7.621C3.528 17.022 8.512 9.588 11.012 6.627c.004-.962-1.374-2.365-2.195-3.196z"/>
                </svg>
              </button>
              <button className="social-button playstation" aria-label="Sign in with PlayStation">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.794.795.794 1.485v4.688c0 .69.363 1.151.854.991.636-.181.854-.795.854-1.485V5.688c.06-3.075-3.427-4.792-7.211-3.092zm11.695 9.738l-5.205-1.614c-.524-.159-.854.363-.854.85v4.692c.06.731.363 1.131.854.97l5.205-1.614c.463-.181.734-.665.734-1.151 0-.486-.271-.97-.734-1.133zm-17.43 3.264l-.794 2.426c-.06.181-.242.363-.423.363H.303c-.181 0-.242-.181-.242-.363l.181-.666c.06-.181.242-.363.423-.363h3.915c.181 0 .242.181.242.363l-.181.666c-.06.181-.242.363-.423.363h-.733l-.733-2.426h.733z"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}