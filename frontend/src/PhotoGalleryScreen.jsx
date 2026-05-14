import React, { useState, useRef, useEffect } from 'react';
import styles from './css/PhotoGalleryScreen.module.css';
import { uploadPhoto, deletePhoto } from './api';

/**
 * PhotoGalleryScreen
 * photos: [{id, url}] — массив объектов фото (id может быть null для превью)
 * userId: number
 * onBack / onSave — колбэки навигации
 */
export default function PhotoGalleryScreen({ photos: initialPhotos, userId, onBack, onSave }) {
  // Нормализуем входящие фото: строки → {id:null, url}
  const normalize = (arr) =>
    (arr || []).map(p => (typeof p === 'string' ? { id: null, url: p } : p));

  const [photos, setPhotos] = useState(normalize(initialPhotos));
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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

  const handleDelete = async (photo, index) => {
    if (!photo.id) {
      // Локальное превью (ещё не сохранено) — просто убираем
      setPhotos(prev => prev.filter((_, i) => i !== index));
      return;
    }

    if (!userId) {
      setPhotos(prev => prev.filter((_, i) => i !== index));
      return;
    }

    setDeletingId(photo.id);
    try {
      await deletePhoto(userId, photo.id);
      setPhotos(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Ошибка удаления фото:', err);
      alert('Не удалось удалить фото: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (photos.length >= MAX_PHOTOS) {
      alert(`Можно добавить не более ${MAX_PHOTOS} фото`);
      return;
    }

    const file = e.target.files[0];
    // Сразу показываем превью без id
    const previewUrl = URL.createObjectURL(file);
    const previewEntry = { id: null, url: previewUrl };
    setPhotos(prev => [...prev, previewEntry]);

    if (userId) {
      setUploading(true);
      try {
        const res = await uploadPhoto(userId, file);
        if (res.success && res.id && res.url) {
          // Заменяем превью на реальный объект с id
          setPhotos(prev =>
            prev.map(p => p.url === previewUrl ? { id: res.id, url: res.url } : p)
          );
        }
      } catch (err) {
        console.warn('Ошибка загрузки фото:', err);
        alert('Не удалось загрузить фото: ' + err.message);
        setPhotos(prev => prev.filter(p => p.url !== previewUrl));
      } finally {
        setUploading(false);
      }
    }

    // Сбрасываем input чтобы можно было выбрать тот же файл повторно
    e.target.value = '';
  };

  const triggerFileInput = () => fileInputRef.current.click();

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
        <h2 className={styles.title}>
          Мои фото {uploading ? '(загрузка…)' : ''}
        </h2>
        <button onClick={handleSave} className={styles.saveBtn} disabled={uploading}>
          Сохранить
        </button>
      </header>

      <div className={styles.gallery}>
        {photos.map((photo, index) => (
          <div key={photo.id ?? `preview-${index}`} className={styles.photoItem}>
            <img src={photo.url} alt={`Фото ${index + 1}`} />
            <button
              className={styles.deleteBtn}
              disabled={deletingId === photo.id}
              onClick={(e) => { e.stopPropagation(); handleDelete(photo, index); }}
            >
              {deletingId === photo.id ? '…' : '✕'}
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
