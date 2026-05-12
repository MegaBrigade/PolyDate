import React, { useState } from 'react';
import styles from './css/ProfileModal.module.css';

export default function ProfileModal({ user, onClose }) {
  const photos = user.photos || (user.photo ? [user.photo] : []);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };
  const prevPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentPhoto = photos[currentPhotoIndex] || '/assets/default-avatar.svg';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.photoContainer}>
          <img src={currentPhoto} alt={user.name} className={styles.photo} />
          {photos.length > 1 && (
            <div className={styles.photoNav}>
              <button onClick={prevPhoto}>‹</button>
              <span>{currentPhotoIndex+1}/{photos.length}</span>
              <button onClick={nextPhoto}>›</button>
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h2>{user.name}, {user.age}</h2>
          <p className={styles.description}>{user.description || user.bio || 'Нет описания'}</p>
          <div className={styles.details}>
            <div><strong>Город:</strong> {user.city || 'Не указан'}</div>
            <div><strong>Образование:</strong> {user.education || 'Не указано'}</div>
            {user.height && <div><strong>Рост:</strong> {user.height} см</div>}
          </div>
        </div>
      </div>
    </div>
  );
}