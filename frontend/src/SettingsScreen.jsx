import React, { useState } from 'react';
import styles from './css/SettingsScreen.module.css';
import { updateProfile, clearUserId } from './api';

/**
 * SettingsScreen
 * userData: { is_visible, ... }
 * userId: number
 * onBack: () => void
 * onLogout: () => void  — вызывается при выходе из аккаунта
 * onProfileUpdate: () => void — обновить профиль в MainApp
 */
export default function SettingsScreen({ userData, userId, onBack, onLogout, onProfileUpdate }) {
  const [isVisible, setIsVisible] = useState(userData?.is_visible ?? true);
  const [savingVisibility, setSavingVisibility] = useState(false);

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
      // Откатываем
      setIsVisible(!newValue);
      alert('Не удалось изменить настройку: ' + err.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm('Выйти из аккаунта?')) return;
    clearUserId();
    if (onLogout) onLogout();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <h2 className={styles.title}>Настройки</h2>
      </header>

      <div className={styles.menu}>
        {/* Видимость профиля */}
        <div className={styles.menuItem} style={{ cursor: 'default' }}>
          <span>Показывать профиль в ленте</span>
          <button
            onClick={handleVisibilityToggle}
            disabled={savingVisibility}
            style={{
              background: isVisible ? '#2a2a2a' : '#ccc',
              border: 'none',
              borderRadius: '12px',
              padding: '4px 14px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              minWidth: '48px',
            }}
          >
            {savingVisibility ? '…' : isVisible ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        <div className={styles.menuItem}>Уведомления <span>On</span></div>
        <div className={styles.menuItem}>Приватность</div>
        <div className={styles.menuItem}>Помощь</div>
        <div
          className={styles.menuItem}
          style={{ color: '#ff69b4', cursor: 'pointer' }}
          onClick={handleLogout}
        >
          Выйти из аккаунта
        </div>
      </div>
    </div>
  );
}
