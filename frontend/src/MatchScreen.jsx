import React from 'react';
import styles from './css/MatchScreen.module.css';

export default function MatchScreen({ matchUser, onClose, currentUserPhoto }) {
  const user = matchUser || { name: 'Пользователь' };
  const userPhoto = user.photo || (user.photos && user.photos[0]) || '/assets/default-avatar.svg';
  const myPhoto = currentUserPhoto || '/assets/default-avatar.svg';

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <img src="/assets/heart-left.svg" className={`${styles.heart} ${styles.heartLeft}`} alt="" />
        <div className={styles.header}>MATCH!</div>
        <img src="/assets/heart-right.svg" className={`${styles.heart} ${styles.heartRight}`} alt="" />
      </div>
      <div className={styles.photosContainer}>
        <div className={`${styles.photoWrapper} ${styles.photoLeft}`}>
          <img src={myPhoto} alt="Вы" />
        </div>
        <div className={`${styles.photoWrapper} ${styles.photoRight}`}>
          <img src={userPhoto} alt={user.name} />
        </div>
      </div>



      <p className={styles.description}>
        Собеседник уже ждет знакомства.<br/>Откройте контакты собеседника и сделайте первый шаг.<br/>Кто знает, возможно, это начало чего-то большого?
      </p>

      <div className={styles.usernameFrame}>{user.name}</div>
      
      <button className={styles.closeBtn} onClick={onClose}>Закрыть</button>
    </div>
  );
}