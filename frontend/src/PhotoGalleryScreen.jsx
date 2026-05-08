import React, { useState, useRef, useEffect } from 'react';
import styles from './css/PhotoGalleryScreen.module.css';

export default function PhotoGalleryScreen({ photos: initialPhotos, onBack, onSave }) {
  const [photos, setPhotos] = useState([...initialPhotos]);
  const fileInputRef = useRef(null);
  const MAX_PHOTOS = 10;

  useEffect(() => {
    const appMain = document.querySelector('.app-main');
    const originalOverflow = appMain ? appMain.style.overflow : null;
    if (appMain) appMain.style.overflow = 'hidden';
    return () => {
      if (appMain && originalOverflow !== null) appMain.style.overflow = originalOverflow;
    };
  }, []);

  const handleDelete = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleAdd = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (photos.length >= MAX_PHOTOS) {
        alert(`Можно добавить не более ${MAX_PHOTOS} фото`);
        return;
      }
      const newPhotoUrl = URL.createObjectURL(e.target.files[0]);
      setPhotos([...photos, newPhotoUrl]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSave = () => {
    if (onSave) onSave(photos);
    else onBack();
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleAdd}
      />
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <h2 className={styles.title}>Мои фото</h2>
        <button onClick={handleSave} className={styles.saveBtn}>Сохранить</button>
      </header>

      <div className={styles.gallery}>
        {photos.map((photo, index) => (
          <div key={index} className={styles.photoItem}>
            <img src={photo} alt={`Фото ${index + 1}`} />
            <button
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
            >
              ✕
            </button>
          </div>
        ))}
        {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, idx) => (
          <div key={`empty-${idx}`} className={styles.addSlot} onClick={triggerFileInput}>
            <span className={styles.plusIcon}>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}