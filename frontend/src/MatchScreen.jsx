import React from 'react';
import styles from './css/MatchScreen.module.css';

export default function MatchScreen({ matchUser, onClose }) {
  const user = matchUser || { username: '@MegaBrigade' };
  return (
    <div className={styles.container}>
      <div className={styles.header}>MATCH!</div>
      <div className={styles.cardArea}>
        <div className={styles.userCard}>Ваша анкета</div>
        <div className={styles.userCard}>Анкета {user.username}</div>
      </div>
      <p className={styles.description}>
        Собеседник уже ждет знакомства. Откройте контакты и сделайте первый шаг.
      </p>
      <div className={styles.usernameFrame}>{user.username}</div>
      <button className={styles.closeBtn} onClick={onClose}>Закрыть</button>
    </div>
  );
}