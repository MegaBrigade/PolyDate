import React from 'react';
import styles from './css/SettingsScreen.module.css';

export default function SettingsScreen({ onBack }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <h2 className={styles.title}>Настройки</h2>
      </header>

      <div className={styles.menu}>
        <div className={styles.menuItem}>Уведомления <span>On</span></div>
        <div className={styles.menuItem}>Приватность</div>
        <div className={styles.menuItem}>Помощь</div>
        <div className={styles.menuItem} style={{color: '#ff69b4'}}>Выйти из аккаунта</div>
      </div>
    </div>
  );
}