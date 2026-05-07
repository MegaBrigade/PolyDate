import React from 'react';
import styles from './css/ProfileScreen.module.css';

export default function ProfileScreen({ userData }) {
  const mockUser = {
    name: 'Иван',
    age: 27,
    city: 'Москва',
    height: 180,
    education: 'Высшее',
    photos: ['/assets/photo-anna.svg']
  };
  const data = userData || mockUser;

  return (
    <div className={styles.profileContainer}>
      {/* Карточка с аватаром */}
      <div className={styles.cardArea}>
        <img src={data.photos[0]} alt="фото профиля" />
        <h3>{data.name}</h3>
        <p className={styles.profileLabel}>Профиль</p>
      </div>

      {/* Кнопки с иконками */}
      <div className={styles.profileButtons}>
        <button className={styles.btnIcon}>
          <img src="/assets/camera.svg" alt="фото" className={styles.btnImg} />
          <span>Выбрать фото</span>
        </button>
        <button className={styles.btnIcon}>
          <img src="/assets/changing.svg" alt="изменить" className={styles.btnImg} />
          <span>Изменить</span>
        </button>
        <button className={styles.btnIcon}>
          <img src="/assets/properties.svg" alt="настройки" className={styles.btnImg} />
          <span>Настройки</span>
        </button>
      </div>

      {/* Меню "Основные" */}
      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>Основные</h3>
        <div className={styles.menuList}>
          <div className={styles.menuItem}>
            <div className={styles.menuLeft}>
              <img src="/assets/city.svg" alt="" className={styles.menuIcon} />
              <span className={styles.menuLabel}>Город</span>
            </div>
            <div className={styles.menuRight}>
              <span className={styles.menuValue}>{data.city}</span>
              <img src="/assets/arrow-right.svg" alt="" className={styles.arrow} />
            </div>
          </div>
          <div className={styles.menuItem}>
            <div className={styles.menuLeft}>
              <img src="/assets/bandage-outline.svg" alt="" className={styles.menuIcon} />
              <span className={styles.menuLabel}>Возраст</span>
            </div>
            <div className={styles.menuRight}>
              <span className={styles.menuValue}>{data.age} лет</span>
              <img src="/assets/arrow-right.svg" alt="" className={styles.arrow} />
            </div>
          </div>
          <div className={styles.menuItem}>
            <div className={styles.menuLeft}>
              <img src="/assets/book.svg" alt="" className={styles.menuIcon} />
              <span className={styles.menuLabel}>Образование</span>
            </div>
            <div className={styles.menuRight}>
              <span className={styles.menuValue}>{data.education}</span>
              <img src="/assets/arrow-right.svg" alt="" className={styles.arrow} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}