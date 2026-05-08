import React from 'react';
import styles from './css/MatchScreen.module.css';

export default function MatchScreen({ matchUser, onClose }) {
  const user = matchUser || { username: '@MegaBrigade', photo: '/assets/photo-anna.svg' };
  
  return (
    <div className={styles.container}>
      <img src="/assets/heart-right.svg" className={`${styles.heart} ${styles.heartTopRight}`} alt="" />
      
      <img src="/assets/heart-left.svg" className={`${styles.heart} ${styles.heartBottomRight}`} alt="" />

      <div className={styles.header}>MATCH!</div>

      <div className={styles.photosContainer}>
        <div className={`${styles.photoWrapper} ${styles.photoLeft}`}>
          <img src="/assets/my-photo.jpg" alt="Вы" />
        </div>
        <div className={`${styles.photoWrapper} ${styles.photoRight}`}>
          <img src={user.photo} alt={user.username} />
        </div>
      </div>

      <p className={styles.description}>
        Собеседник уже ждет знакомства.<br/>Откройте контакты собеседника и сделайте первый шаг.<br/>Кто знает, возможно, это начало чего-то большого?
      </p>

      <div className={styles.usernameFrame}>{user.username}</div>
      
      <button className={styles.closeBtn} onClick={onClose}>Закрыть</button>
    </div>
  );
}