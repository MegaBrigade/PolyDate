import React, { useState } from 'react';
import styles from './css/likes.module.css';

export default function LikeCard({ user, onLike, onDislike, onOpenProfile }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = user.photos || (user.photo ? [user.photo] : []);

  const nextPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className={styles.card}>
      <div className={styles.photoContainer} onClick={() => onOpenProfile(user)}>
        <img src={photos[currentPhotoIndex]} alt={user.name} className={styles.photo} />
        {photos.length > 1 && (
          <>
            {/* Индикаторы (полоски) */}
            <div className={styles.indicators}>
              {photos.map((_, i) => (
                <div key={i} className={`${styles.bar} ${i === currentPhotoIndex ? styles.barActive : ''}`} />
              ))}
            </div>
            {/* Зоны тапа для листания */}
            <div className={styles.touchZones}>
              <div className={styles.zone} onClick={prevPhoto} />
              <div className={styles.zone} onClick={nextPhoto} />
            </div>
          </>
        )}
      </div>
      <div className={styles.badge}>{user.compatibility}%</div>
      <div className={styles.overlay} onClick={() => onOpenProfile(user)}>
        <div className={styles.name}>{user.name}, {user.age}</div>
        <p className={styles.description}>{user.description}</p>
        <div className={styles.buttonGroup}>
          <button onClick={(e) => { e.stopPropagation(); onDislike(user.id); }} className={`${styles.actionBtn} ${styles.dislike}`}>
            <img src="/assets/dislike.svg" alt="dislike" className={styles.icon} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onLike(user); }} className={`${styles.actionBtn} ${styles.like} ${user.liked ? styles.likedActive : ''}`}>
            <img src="/assets/like.svg" alt="like" className={styles.icon} />
          </button>
        </div>
      </div>
    </div>
  );
}