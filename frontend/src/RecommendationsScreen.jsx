import React, { useState, useEffect, onMatch } from 'react';
import styles from './css/RecommendationsScreen.module.css';

const mockProfiles = [
  {
    id: 1,
    name: 'Анна',
    age: 25,
    bio: 'Люблю путешествия и кофе. Ищу человека, с которым можно разделить рассветы.',
    photos: ['/assets/photo-anna.svg', '/assets/photo-anna.svg', '/assets/photo-anna.svg'],
    compatibility: 90,
    isMutual: true
  },
  {
    id: 2,
    name: 'Мария',
    age: 28,
    bio: 'Архитектор. Верю в минимализм и искренность.',
    photos: ['/assets/photo-anna.svg'],
    compatibility: 75,
    isMutual: false
  },
];

export default function RecommendationsScreen({ onMatch }) {
  const [profiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const user = profiles[currentIndex];

  const handleNextPhoto = () => {
    if (isTransitioning) return;
    if (user.photos.length === 1) return;
    setIsTransitioning(true);
    const next = (currentPhoto + 1) % user.photos.length;
    setTimeout(() => {
      setCurrentPhoto(next);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrevPhoto = () => {
    if (isTransitioning) return;
    if (user.photos.length === 1) return;
    setIsTransitioning(true);
    const prev = (currentPhoto - 1 + user.photos.length) % user.photos.length;
    setTimeout(() => {
      setCurrentPhoto(prev);
      setIsTransitioning(false);
    }, 150);
  };

  const handleAction = (type) => {
    if (type === 'like' && user.isMutual) {
      // setShowMatch(true);
      onMatch?.(user);
    } else {
      moveToNextProfile();
    }
  };

  const moveToNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentPhoto(0);
    } else {
      alert("Анкеты временно закончились");
    }
  };
  useEffect(() => {
    // Находим родительский контейнер и отключаем скролл
    const parent = document.querySelector('.app-main');
    if (parent) parent.style.overflowY = 'hidden';
    
    return () => {
      if (parent) parent.style.overflowY = 'auto';
    };
  }, []);
  if (!user) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      {showMatch && (
        <div className={styles.matchOverlay}>
          <h1 className={styles.matchTitle}>MATCH!</h1>
          <p>Вы понравились друг другу!</p>
          <button className={styles.btn} style={{width: '200px', marginTop: '20px'}} onClick={() => {setShowMatch(false); moveToNextProfile();}}>
            Продолжить
          </button>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>Для вас</h1>
        <img src="/assets/polydate.svg" alt="logo" className={styles.logo} />
      </header>

      <div className={styles.card}>
        <div className={styles.indicators}>
          {user.photos.map((_, i) => (
            <div key={i} className={`${styles.bar} ${i === currentPhoto ? styles.barActive : ''}`} />
          ))}
        </div>
        <div className={styles.compatibility}>
          {user.compatibility}%
        </div>
        <img
          src={user.photos[currentPhoto]}
          alt={user.name}
          className={`${styles.photo} ${isTransitioning ? styles.photoTransition : ''}`}
        />

        <div className={styles.touchZones}>
          <div className={styles.zone} onClick={handlePrevPhoto} />
          <div className={styles.zone} onClick={handleNextPhoto} />
        </div>

        <div className={styles.overlay}>
          <div className={styles.nameAge}>{user.name}, {user.age}</div>
          <p className={styles.bio}>{user.bio}</p>

          <div className={styles.actionGroup}>
            <button className={`${styles.btn} ${styles.dislike}`} onClick={() => handleAction('dislike')}>
              <img src="/assets/dislike.svg" alt="no" className={styles.icon} />
            </button>
            <button className={`${styles.btn} ${styles.like}`} onClick={() => handleAction('like')}>
              <img src="/assets/like.svg" alt="yes" className={styles.icon} />
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}