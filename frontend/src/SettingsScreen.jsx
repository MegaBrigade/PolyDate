import React, { useState } from 'react';
import styles from './css/SettingsScreen.module.css';
import TagsSelectionScreen from './TagsSelectionScreen';
import { updateProfile, updateTags, clearUserId } from './api';

const NOTIF_KEY = 'polydate_notifications';

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '100%', background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px',
        maxHeight: '70vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: 'Gilroy-ExtraBold, sans-serif', fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: '#f0f0f0', border: 'none', borderRadius: '50%',
            width: 32, height: 32, fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * SettingsScreen
 * userData: { is_visible, tags, ... }
 * userId: number
 * onBack: () => void
 * onLogout: () => void
 * onProfileUpdate: () => void
 */
export default function SettingsScreen({ userData, userId, onBack, onLogout, onProfileUpdate }) {
  const [isVisible, setIsVisible]             = useState(userData?.is_visible ?? true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [showTags, setShowTags]               = useState(false);
  const [notifications, setNotifications]     = useState(
    () => localStorage.getItem(NOTIF_KEY) !== 'false'
  );
  const [savingNotif, setSavingNotif]         = useState(false);
  const [modal, setModal]                     = useState(null); // 'privacy' | 'help'

  // ── Видимость профиля ──────────────────────────────────────
  const handleVisibilityToggle = async () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    if (!userId) return;
    setSavingVisibility(true);
    try {
      await updateProfile(userId, { is_visible: newValue });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error('Не удалось сохранить видимость:', err);
      setIsVisible(!newValue);
      alert('Не удалось изменить настройку: ' + err.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  // ── Уведомления ────────────────────────────────────────────
  const handleNotificationsToggle = async () => {
    const newValue = !notifications;
    setSavingNotif(true);
    setNotifications(newValue);
    localStorage.setItem(NOTIF_KEY, String(newValue));

    // Если приложение запущено в Telegram WebApp — запрашиваем / отзываем разрешение
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        if (newValue && tg.requestWriteAccess) {
          tg.requestWriteAccess((allowed) => {
            if (!allowed) {
              // Пользователь отказал — откатываем
              setNotifications(false);
              localStorage.setItem(NOTIF_KEY, 'false');
            }
          });
        }
      }
      // Сохраняем на бэкенд если появится соответствующий endpoint
      // await updateProfile(userId, { notifications_enabled: newValue });
    } catch (err) {
      console.error('Ошибка уведомлений:', err);
    } finally {
      setSavingNotif(false);
    }
  };

  // ── Выход ──────────────────────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm('Выйти из аккаунта?')) return;
    clearUserId();
    if (onLogout) onLogout();
  };

  // ── Теги ───────────────────────────────────────────────────
  if (showTags) {
    return (
      <TagsSelectionScreen
        initialTags={userData?.tags || []}
        onSave={async (newTags) => {
          try {
            await updateTags(userId, newTags);
            if (onProfileUpdate) onProfileUpdate();
          } catch (err) {
            console.error('Ошибка сохранения тегов:', err);
            alert('Не удалось сохранить теги: ' + err.message);
          }
          setShowTags(false);
        }}
        onBack={() => setShowTags(false)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <h2 className={styles.title}>Настройки</h2>
      </header>

      <div className={styles.menu}>

        {/* Выбор тегов */}
        <div className={styles.menuItem} onClick={() => setShowTags(true)}>
          <span>Выбор тегов</span>
          <span style={{ opacity: 0.4, fontSize: 18 }}>›</span>
        </div>

        {/* Видимость в ленте */}
        <div className={styles.menuItem} style={{ cursor: 'default' }}>
          <span>Показывать профиль в ленте</span>
          <ToggleButton
            active={isVisible}
            loading={savingVisibility}
            onToggle={handleVisibilityToggle}
          />
        </div>

        {/* Уведомления */}
        <div className={styles.menuItem} style={{ cursor: 'default' }}>
          <span>Уведомления</span>
          <ToggleButton
            active={notifications}
            loading={savingNotif}
            onToggle={handleNotificationsToggle}
          />
        </div>

        {/* Приватность */}
        <div className={styles.menuItem} onClick={() => setModal('privacy')}>
          <span>Приватность</span>
          <span style={{ opacity: 0.4, fontSize: 18 }}>›</span>
        </div>

        {/* Помощь */}
        <div className={styles.menuItem} onClick={() => setModal('help')}>
          <span>Помощь</span>
          <span style={{ opacity: 0.4, fontSize: 18 }}>›</span>
        </div>

        {/* Выход */}
        <div
          className={styles.menuItem}
          style={{ color: '#ff69b4', cursor: 'pointer' }}
          onClick={handleLogout}
        >
          Выйти из аккаунта
        </div>
      </div>

      {/* Модалка «Приватность» */}
      {modal === 'privacy' && (
        <Modal title="Приватность" onClose={() => setModal(null)}>
          <PrivacyContent />
        </Modal>
      )}

      {/* Модалка «Помощь» */}
      {modal === 'help' && (
        <Modal title="Помощь" onClose={() => setModal(null)}>
          <HelpContent />
        </Modal>
      )}
    </div>
  );
}

// ── Переиспользуемый тоггл-кнопка ──────────────────────────
function ToggleButton({ active, loading, onToggle }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      style={{
        background: active ? '#383436' : '#ccc',
        border: 'none',
        borderRadius: '12px',
        padding: '4px 14px',
        color: '#fff',
        fontSize: '13px',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        minWidth: '52px',
        fontFamily: 'Gilroy-ExtraBold, sans-serif',
      }}
    >
      {loading ? '…' : active ? 'Вкл' : 'Выкл'}
    </button>
  );
}

// ── Контент модалок ─────────────────────────────────────────
function PrivacyContent() {
  const p = {
    fontFamily: 'Gilroy-Light, sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#444',
    marginBottom: 14,
  };
  const h = {
    fontFamily: 'Gilroy-ExtraBold, sans-serif',
    fontSize: 15,
    margin: '16px 0 6px',
    color: '#222',
  };
  return (
    <div>
      <p style={p}>PolyDate хранит только те данные, которые необходимы для работы сервиса.</p>
      <p style={h}>Какие данные мы собираем</p>
      <p style={p}>Имя, возраст, город, фото профиля, интересы (теги) и результаты теста совместимости. Геолокация используется только для поиска анкет рядом и не передаётся третьим лицам.</p>
      <p style={h}>Кто видит ваш профиль</p>
      <p style={p}>Только зарегистрированные пользователи PolyDate. Вы можете скрыть профиль из ленты в любой момент через настройку «Показывать профиль в ленте».</p>
      <p style={h}>Удаление данных</p>
      <p style={p}>Чтобы удалить аккаунт и все связанные данные — напишите в поддержку. Удаление происходит в течение 72 часов.</p>
      <p style={h}>Контакт</p>
      <p style={p}>По вопросам приватности: <span style={{ color: '#FF76C1' }}>privacy@polydate.app</span></p>
    </div>
  );
}

function HelpContent() {
  const p = {
    fontFamily: 'Gilroy-Light, sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#444',
    marginBottom: 14,
  };
  const q = {
    fontFamily: 'Gilroy-ExtraBold, sans-serif',
    fontSize: 14,
    margin: '14px 0 4px',
    color: '#222',
  };
  const faq = [
    ['Почему нет анкет в ленте?',
     'Проверьте фильтры — возможно, радиус или возраст слишком ограничены. Также убедитесь, что у вас указан город.'],
    ['Как работает процент совместимости?',
     'Он рассчитывается на основе совпадения тегов интересов и результатов теста личности (OCEAN). Чем больше совпадений — тем выше процент.'],
    ['Не приходят уведомления',
     'Убедитесь, что уведомления включены в настройках и разрешены в вашем Telegram.'],
    ['Как удалить аккаунт?',
     'Напишите нам на support@polydate.app — удалим данные в течение 72 часов.'],
  ];

  return (
    <div>
      <p style={{ ...p, marginBottom: 20 }}>
        Если не нашли ответ ниже — напишите нам: <span style={{ color: '#FF76C1' }}>support@polydate.app</span>
      </p>
      {faq.map(([question, answer]) => (
        <div key={question}>
          <p style={q}>{question}</p>
          <p style={p}>{answer}</p>
        </div>
      ))}
    </div>
  );
}