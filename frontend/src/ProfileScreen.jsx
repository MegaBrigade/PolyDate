import React from 'react';
import styles from './css/ProfileScreen.module.css';

export default function ProfileScreen({ userData }) {
  const mockUser = {
    name: 'Иван',
    age: 27,
    city: 'Москва',
    height: 180,
    education: 'Высшее',
    bio: 'Люблю путешествия и кофе. Ищу человека для долгих отношений.',
    photos: ['/assets/photo-anna.svg']
  };
  const data = userData || mockUser;

  return (
    <div className={styles.profileContainer}>
      {/* Аватар и имя */}
      <header className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
        <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
      </header>

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

      {/* Блок "О себе" (описание профиля) */}
      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>О себе</h3>
        <div className={styles.bioCard}>
          <p>{data.bio}</p>
        </div>
      </div>

      {/* Блок "Основные" с вертикальными карточками */}
      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>Основные</h3>
        <div className={styles.infoCard}>
          {/* Город */}
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <img src="/assets/city.svg" alt="" className={styles.infoImg} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{data.city}</span>
            </div>
          </div>
          {/* Возраст */}
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <img src="/assets/bandage-outline.svg" alt="" className={styles.infoImg} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Возраст</span>
              <span className={styles.infoValue}>{data.age} лет</span>
            </div>
          </div>
          {/* Образование */}
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <img src="/assets/book.svg" alt="" className={styles.infoImg} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Образование</span>
              <span className={styles.infoValue}>{data.education}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}