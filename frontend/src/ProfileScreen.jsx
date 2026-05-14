import React, { useRef, useState } from 'react';
import styles from './css/ProfileScreen.module.css';
import ProfileEditScreen from './ProfileEditScreen';
import SettingsScreen from './SettingsScreen';
import PhotoGalleryScreen from './PhotoGalleryScreen';

// FIX: принимаем userId, onProfileUpdate и onLogout из MainApp
export default function ProfileScreen({ userData, userId, onProfileUpdate, onLogout }) {
  const fileInputRef = useRef(null);
  const [activeView, setActiveView] = useState('main');
  const [showGallery, setShowGallery] = useState(false);

  const data = userData || {
    name: 'Загрузка…',
    age: '',
    city: '',
    bio: '',
    photos: [],
    tags: [],
    is_visible: true,
  };

  // photos — [{id, url}] или fallback
  const photoObjects = Array.isArray(data.photos) && data.photos.length > 0
    ? data.photos
    : [{ id: null, url: '/assets/profile-photo.svg' }];

  const avatarUrl = photoObjects[0]?.url ?? '/assets/profile-photo.svg';

  if (showGallery) {
    return (
      <PhotoGalleryScreen
        photos={photoObjects}
        userId={userId}
        onBack={() => setShowGallery(false)}
        onSave={() => {
          if (onProfileUpdate) onProfileUpdate();
          setShowGallery(false);
        }}
      />
    );
  }

  if (activeView === 'edit') {
    return (
      <ProfileEditScreen
        data={data}
        userId={userId}
        onBack={() => setActiveView('main')}
        onSave={() => {
          if (onProfileUpdate) onProfileUpdate();
        }}
      />
    );
  }

  if (activeView === 'settings') {
    return (
      <SettingsScreen
        userData={data}
        userId={userId}
        onBack={() => setActiveView('main')}
        onLogout={onLogout}
        onProfileUpdate={onProfileUpdate}
      />
    );
  }

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
        <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
      </header>

      <div className={styles.cardArea} onClick={() => setShowGallery(true)} style={{ cursor: 'pointer' }}>
        <img src={avatarUrl} alt="аватарка" className={styles.avatar} />
        <h3>{data.name}</h3>
        <p className={styles.profileLabel}>Профиль</p>
      </div>

      <div className={styles.profileButtons}>
        <button className={styles.btnIcon} onClick={() => setShowGallery(true)}>
          <img src="/assets/camera.svg" alt="фото" className={styles.btnImg} />
          <span>Выбрать фото</span>
        </button>
        <button className={styles.btnIcon} onClick={() => setActiveView('edit')}>
          <img src="/assets/changing.svg" alt="ред" className={styles.btnImg} />
          <span>Изменить</span>
        </button>
        <button className={styles.btnIcon} onClick={() => setActiveView('settings')}>
          <img src="/assets/properties.svg" alt="настр" className={styles.btnImg} />
          <span>Настройки</span>
        </button>
      </div>

      {data.bio && (
        <div className={styles.menuSection}>
          <h3 className={styles.menuTitle}>О себе</h3>
          <div className={styles.bioCard}>
            <p>{data.bio}</p>
          </div>
        </div>
      )}

      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>Основные</h3>
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><img src="/assets/city.svg" alt="" className={styles.infoImg} /></div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{data.city || '—'}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><img src="/assets/bandage-outline.svg" alt="" className={styles.infoImg} /></div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Возраст</span>
              <span className={styles.infoValue}>{data.age ? `${data.age} лет` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {data.tags && data.tags.length > 0 && (
        <div className={styles.menuSection}>
          <h3 className={styles.menuTitle}>Интересы</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 4px' }}>
            {data.tags.map(tag => (
              <span key={tag} style={{
                background: '#2a2a2a', color: '#fff', padding: '4px 12px',
                borderRadius: '16px', fontSize: '13px'
              }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

