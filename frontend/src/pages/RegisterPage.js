import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { fetchAPI, getUploadsBaseUrl } from "../services/api";
import "../styles/RegisterPage.css";

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

// ===== Компонент вводу дати народження =====
function BirthdayInput({ value, onChange, error, inputClassName }) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Збираємо дату і передаємо вгору
  const buildDate = (d, m, y) => {
    if (d && m && y && y.length === 4) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const handleDay = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(val);
    buildDate(val, month, year);
    if (val.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMonth(val);
    buildDate(day, val, year);
    if (val.length === 2) yearRef.current?.focus();
  };

  const handleYear = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(val);
    buildDate(day, month, val);
  };

  return (
    <div className="birthday-input-wrapper">
      <input
        type="text"
        inputMode="numeric"
        placeholder="ДД"
        value={day}
        onChange={handleDay}
        maxLength={2}
        className={`${inputClassName} birthday-input-part`}
      />
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="ММ"
        value={month}
        onChange={handleMonth}
        maxLength={2}
        className={`${inputClassName} birthday-input-part`}
      />
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="РРРР"
        value={year}
        onChange={handleYear}
        maxLength={4}
        className={`${inputClassName} birthday-input-part birthday-input-year`}
      />
    </div>
  );
}

// ===== Валідація дати =====
function validateBirthday(dateStr) {
  if (!dateStr) return "Вкажіть дату народження.";

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (!year || !month || !day) return "Вкажіть повну дату.";
  if (month < 1 || month > 12) return "Місяць має бути від 1 до 12.";

  // Перевірка кількості днів у місяці
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return `У цьому місяці лише ${daysInMonth} днів.`;

  const today = new Date();
  const birthDate = new Date(year, month - 1, day);

  if (birthDate > today) return "Дата народження не може бути в майбутньому.";

  const age = today.getFullYear() - year;
  if (age > 120) return "Введіть коректний рік народження.";
  if (year < 1900) return "Введіть коректний рік народження.";

  return "";
}

export default function RegisterPage({ onRegister }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    policyAccepted: false,
    password: "",
    nickname: "",
    birthday: "",
    selectedUserIds: [],
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    nickname: "",
    birthday: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popularUsers, setPopularUsers] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState(null);
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleUserSelection = (id) => {
    setFormData((prev) => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(id)
        ? prev.selectedUserIds.filter((x) => x !== id)
        : [...prev.selectedUserIds, id],
    }));
  };

  const isEmailValid = (email) => {
    if (!email) return false;
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateCurrentStep = () => {
    const newErrors = { email: "", password: "", nickname: "", birthday: "" };
    if (step === 1) {
      if (!formData.email) newErrors.email = "Введіть email.";
      else if (!isEmailValid(formData.email)) newErrors.email = "Неправильний формат email.";
      if (!formData.policyAccepted) newErrors.email = newErrors.email || "Потрібно погодитись з політикою конфіденційності.";
    } else if (step === 2) {
      if (!formData.password) newErrors.password = "Введіть пароль.";
      else if (formData.password.length < 6) newErrors.password = "Пароль має містити щонайменше 6 символів.";
    } else if (step === 3) {
      if (!formData.nickname.trim()) newErrors.nickname = "Введіть нікнейм.";
    } else if (step === 4) {
      newErrors.birthday = validateBirthday(formData.birthday);
    }
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleNext = async () => {
    setError(null);
    if (!validateCurrentStep()) return;

    if (step === 1) {
      try {
        setLoading(true);
        const data = await authService.checkEmail(formData.email);
        if (data.exists) {
          setFieldErrors((prev) => ({ ...prev, email: "Користувач з таким email вже існує." }));
          return;
        }
        setStep(2);
      } catch (err) {
        setError("Не вдалося перевірити email. Спробуйте ще раз.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      try {
        setLoading(true);
        const data = await authService.checkNickname(formData.nickname.trim());
        if (data.exists) {
          setFieldErrors((prev) => ({ ...prev, nickname: "Користувач з таким нікнеймом вже існує." }));
          return;
        }
        setStep(4);
      } catch (err) {
        setError("Не вдалося перевірити нікнейм. Спробуйте ще раз.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 4) {
      try {
        setLoading(true);
        const data = await authService.register({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          birthday: formData.birthday,
        });
        if (data?.user) onRegister?.(data.user);
        setStep(5);
      } catch (err) {
        const message = err.message || "Registration failed";
        const updatedFieldErrors = { ...fieldErrors };
        if (message.includes("Password must be at least 6 characters")) updatedFieldErrors.password = "Пароль має містити щонайменше 6 символів.";
        else if (message.includes("Email already exists")) updatedFieldErrors.email = "Користувач з таким email вже існує.";
        else if (message.includes("Nickname already exists")) updatedFieldErrors.nickname = "Користувач з таким нікнеймом вже існує.";
        else if (message.includes("All fields are required")) updatedFieldErrors.email = "Усі поля обов'язкові для заповнення.";
        setFieldErrors(updatedFieldErrors);
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (step !== 5) return;
    const loadPopular = async () => {
      setPopularError(null);
      setPopularLoading(true);
      try {
        const users = await fetchAPI("/users/recommended?limit=10", { method: "GET" });
        setPopularUsers(Array.isArray(users) ? users : []);
      } catch (e) {
        setPopularUsers([]);
        setPopularError("Не вдалося завантажити рекомендації.");
      } finally {
        setPopularLoading(false);
      }
    };
    loadPopular();
  }, [step]);

  const handleFinish = async (doSubscribe) => {
    if (doSubscribe && formData.selectedUserIds.length > 0) {
      try {
        setLoading(true);
        await Promise.all(
          formData.selectedUserIds.map((channelId) =>
            fetchAPI("/subscriptions/subscribe", { method: "POST", body: { channelId } })
          )
        );
      } catch (e) {
        setError("Не вдалося підписатися на деяких користувачів. Спробуйте пізніше.");
      } finally {
        setLoading(false);
      }
    }
    navigate("/");
  };

  const stepTitles = {
    1: "Реєстрація",
    2: "Придумайте пароль",
    3: "Ваш нікнейм",
    4: "Дата народження",
    5: "Кого підписатись?",
  };

  // ===== МОБІЛЬНА ВЕРСІЯ =====
  if (isMobile) {
    return (
      <div className="register-mobile-container">
        <button
          className="register-mobile-back"
          onClick={() => {
            if (step === 1) navigate("/");
            else setStep((s) => Math.max(1, s - 1));
          }}
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {step === 1 ? "Назад до першого екрана" : "Назад"}
        </button>

        <h1 className="register-mobile-title">{stepTitles[step]}</h1>
        {step < 5 && <p className="register-mobile-step">Крок {step} з 4</p>}

        {error && <div className="register-error">{error}</div>}

        {step === 1 && (
          <div className="register-mobile-fields">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="example@email.com"
              className="register-mobile-input"
            />
            {fieldErrors.email && <span className="register-field-error">{fieldErrors.email}</span>}
          </div>
        )}

        {step === 2 && (
          <div className="register-mobile-fields">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Мінімум 6 символів"
              className="register-mobile-input"
            />
            {fieldErrors.password && <span className="register-field-error">{fieldErrors.password}</span>}
          </div>
        )}

        {step === 3 && (
          <div className="register-mobile-fields">
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
              placeholder="Введіть ваш нікнейм"
              className="register-mobile-input"
            />
            {fieldErrors.nickname && <span className="register-field-error">{fieldErrors.nickname}</span>}
          </div>
        )}

        {/* Крок 4: Дата народження — три поля */}
        {step === 4 && (
          <div className="register-mobile-fields">
            <BirthdayInput
              value={formData.birthday}
              onChange={(val) => handleChange("birthday", val)}
              error={fieldErrors.birthday}
              inputClassName="register-mobile-input"
            />
            {fieldErrors.birthday && <span className="register-field-error">{fieldErrors.birthday}</span>}
          </div>
        )}

        {step === 5 && (
          <div className="register-mobile-popular">
            <p className="register-mobile-popular-text">
              Підпишіться на найпопулярніших або пропустіть цей крок.
            </p>
            <div className="register-mobile-popular-list">
              {popularLoading && <div className="register-popular-loading">Завантаження…</div>}
              {popularError && <div className="register-popular-error">{popularError}</div>}
              {!popularLoading && !popularError && popularUsers.length === 0 && (
                <div className="register-popular-empty">Наразі немає рекомендацій.</div>
              )}
              {popularUsers.map((u) => {
                const selected = formData.selectedUserIds.includes(u.user_id);
                const avatarSrc = u.avatar_url ? getUploadsBaseUrl() + u.avatar_url : null;
                return (
                  <button
                    key={u.user_id}
                    type="button"
                    onClick={() => toggleUserSelection(u.user_id)}
                    className={`register-mobile-popular-item ${selected ? "selected" : ""}`}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="register-popular-avatar" />
                    ) : (
                      <div className="register-popular-avatar register-popular-avatar--placeholder" />
                    )}
                    <span className="register-popular-nickname">{u.nickname}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="register-mobile-actions">
          {step === 1 && (
            <label className="register-mobile-policy">
              <span>Політика конфіденційності</span>
              <input
                type="checkbox"
                checked={formData.policyAccepted}
                onChange={(e) => handleChange("policyAccepted", e.target.checked)}
              />
            </label>
          )}

          {step < 5 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || (step === 1 && !formData.policyAccepted)}
              className="register-mobile-next-btn"
            >
              {loading ? "Зачекайте..." : "Далі"}
            </button>
          )}

          {step === 5 && (
            <>
              <button type="button" onClick={() => handleFinish(false)} className="register-mobile-skip-btn" disabled={loading}>
                Пропустити
              </button>
              <button type="button" onClick={() => handleFinish(true)} className="register-mobile-next-btn" disabled={loading}>
                {loading ? "Зачекайте..." : "Підписатися"}
              </button>
            </>
          )}
        </div>

        <p className="register-mobile-login-text">
          Вже маєте акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    );
  }

  // ===== ДЕСКТОПНА ВЕРСІЯ =====
  return (
    <div className="registerContainer">
      <div className="register-star-background" />

      <div className="register-left">
        <div className="register-text-content">
          <h1 className="register-main-title">
            Стань<br />частиною<br />живого<br />моменту.
          </h1>
          <p className="register-subtitle">
            Твій простір для живого відео.<br />Разом із мільйонами однодумців.
          </p>
        </div>
      </div>

      <div className="register-right">
        <h1 className="register-right-title">Реєстрація</h1>
        <p className="register-step-info">Крок {step} з 5</p>

        {error && <div className="register-error">{error}</div>}

        {step === 1 && (
          <div className="register-step-content">
            <div className="register-form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="example@email.com" required className="register-input" />
              {fieldErrors.email && <span className="register-field-error">{fieldErrors.email}</span>}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="register-step-content">
            <div className="register-form-group">
              <label>Створіть пароль</label>
              <input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Мінімум 6 символів" required minLength={6} className="register-input" />
              {fieldErrors.password && <span className="register-field-error">{fieldErrors.password}</span>}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="register-step-content">
            <div className="register-form-group">
              <label>Нікнейм</label>
              <input type="text" value={formData.nickname} onChange={(e) => handleChange("nickname", e.target.value)} placeholder="Введіть ваш нікнейм" required className="register-input" />
              {fieldErrors.nickname && <span className="register-field-error">{fieldErrors.nickname}</span>}
            </div>
          </div>
        )}
        {/* Крок 4: Дата народження — три поля */}
        {step === 4 && (
          <div className="register-step-content">
            <div className="register-form-group">
              <label>Дата народження</label>
              <BirthdayInput
                value={formData.birthday}
                onChange={(val) => handleChange("birthday", val)}
                error={fieldErrors.birthday}
                inputClassName="register-input"
              />
              {fieldErrors.birthday && <span className="register-field-error">{fieldErrors.birthday}</span>}
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="register-popular-wrapper">
            <p className="register-popular-text">Підпишіться на найпопулярніших користувачів або пропустіть цей крок.</p>
            <div className="register-popular-list">
              {popularLoading && <div className="register-popular-loading">Завантаження…</div>}
              {popularError && <div className="register-popular-error">{popularError}</div>}
              {!popularLoading && !popularError && popularUsers.length === 0 && <div className="register-popular-empty">Наразі немає рекомендацій.</div>}
              {popularUsers.map((u) => {
                const selected = formData.selectedUserIds.includes(u.user_id);
                const avatarSrc = u.avatar_url ? getUploadsBaseUrl() + u.avatar_url : null;
                return (
                  <button key={u.user_id} type="button" onClick={() => toggleUserSelection(u.user_id)} className={`register-popular-item ${selected ? "selected" : ""}`}>
                    {avatarSrc ? <img src={avatarSrc} alt="" className="register-popular-avatar" /> : <div className="register-popular-avatar register-popular-avatar--placeholder" />}
                    <span className="register-popular-nickname">{u.nickname}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="register-actions">
          {step > 1 && step < 5 && (
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={loading} className="register-back-btn">Назад</button>
          )}
          {step === 1 && (
            <label className="register-policy-label">
              <span>Політика конфіденційності</span>
              <input type="checkbox" checked={formData.policyAccepted} onChange={(e) => handleChange("policyAccepted", e.target.checked)} />
            </label>
          )}
          {step < 5 && (
            <button type="button" onClick={handleNext} disabled={loading || (step === 1 && !formData.policyAccepted)} className="register-next-btn">
              {loading ? "Зачекайте..." : "Далі"}
            </button>
          )}
          {step === 5 && (
            <>
              <button type="button" onClick={() => handleFinish(false)} className="register-skip-btn" disabled={loading}>Пропустити</button>
              <button type="button" onClick={() => handleFinish(true)} className="register-subscribe-btn" disabled={loading}>{loading ? "Зачекайте..." : "Підписатися"}</button>
            </>
          )}
        </div>

        <p className="register-login-text">
          Вже маєте акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}