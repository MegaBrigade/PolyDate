// import React, { useRef } from 'react';
// import styles from './css/ProfileScreen.module.css';

// export default function ProfileScreen({ userData }) {
//   const fileInputRef = useRef(null);

//   const mockUser = {
//     name: 'Иван',
//     age: 27,
//     city: 'Москва',
//     height: 180,
//     education: 'Высшее',
//     bio: 'Люблю путешествия и кофе. Ищу человека для долгих отношений.',
//     photos: ['/assets/photo-anna.svg']
//   };
  
//   const data = userData || mockUser;

//   const handleChoosePhoto = () => {
//     fileInputRef.current.click();
//   };

//   const handleEdit = () => {
//     alert("Открытие экрана редактирования...");
//   };

//   const handleSettings = () => {
//     alert("Открытие настроек...");
//   };

//   return (
//     <div className={styles.profileContainer}>
//       {}
//       <input 
//         type="file" 
//         ref={fileInputRef} 
//         style={{ display: 'none' }} 
//         accept="image/*"
//         onChange={(e) => console.log("Файл выбран:", e.target.files[0])}
//       />

//       <header className={styles.header}>
//         <h1 className={styles.title}>Профиль</h1>
//         <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
//       </header>

//       <div className={styles.cardArea}>
//         <img src={data.photos[0]} alt="аватарка" className={styles.avatar} />
//         <h3>{data.name}</h3>
//         <p className={styles.profileLabel}>Профиль</p>
//       </div>

//       <div className={styles.profileButtons}>
//         <button className={styles.btnIcon} onClick={handleChoosePhoto}>
//           <img src="/assets/camera.svg" alt="фото" className={styles.btnImg} />
//           <span>Выбрать фото</span>
//         </button>
//         <button className={styles.btnIcon} onClick={handleEdit}>
//           <img src="/assets/changing.svg" alt="ред" className={styles.btnImg} />
//           <span>Изменить</span>
//         </button>
//         <button className={styles.btnIcon} onClick={handleSettings}>
//           <img src="/assets/properties.svg" alt="настр" className={styles.btnImg} />
//           <span>Настройки</span>
//         </button>
//       </div>

//       <div className={styles.menuSection}>
//         <h3 className={styles.menuTitle}>Основные</h3>
//         <div className={styles.infoCard}>
//           <div className={styles.infoItem}>
//             <div className={styles.infoIcon}>
//               <img src="/assets/city.svg" alt="" className={styles.infoImg} />
//             </div>
//             <div className={styles.infoContent}>
//               <span className={styles.infoLabel}>Город</span>
//               <span className={styles.infoValue}>{data.city}</span>
//             </div>
//           </div>
//           <div className={styles.infoItem}>
//             <div className={styles.infoIcon}>
//               <img src="/assets/bandage-outline.svg" alt="" className={styles.infoImg} />
//             </div>
//             <div className={styles.infoContent}>
//               <span className={styles.infoLabel}>Возраст</span>
//               <span className={styles.infoValue}>{data.age} лет</span>
//             </div>
//           </div>
//           <div className={styles.infoItem}>
//             <div className={styles.infoIcon}>
//               <img src="/assets/book.svg" alt="" className={styles.infoImg} />
//             </div>
//             <div className={styles.infoContent}>
//               <span className={styles.infoLabel}>Образование</span>
//               <span className={styles.infoValue}>{data.education}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useRef, useState } from 'react';
import styles from './css/ProfileScreen.module.css';

import ProfileEditScreen from './ProfileEditScreen';
import SettingsScreen from './SettingsScreen';
import PhotoGalleryScreen from './PhotoGalleryScreen';
export default function ProfileScreen({ userData }) {
  const fileInputRef = useRef(null);
  
  const [activeView, setActiveView] = useState('main');

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
  const [showGallery, setShowGallery] = useState(false);
  const handleAvatarClick = () => {
    setShowGallery(true);
  };
  const handleAddPhoto = () => {
    fileInputRef.current.click();
  };

  const onFileChange = (e) => {
    if (e.target.files[0]) {
      // Здесь будет логика загрузки фото на сервер
      console.log("Файл выбран:", e.target.files[0]);
    }
  };

  // В JSX, в блоке с аватаром добавляем onClick
  // <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
  //   <img src={data.photos[0]} alt="аватарка" className={styles.mainAvatar} />
  //   <div className={styles.avatarBadge}>Фото</div>
  // </div>

  // Условный рендеринг галереи
  // if (showGallery) {
  //   return (
  //     <PhotoGalleryScreen
  //       photos={data.photos}
  //       onBack={() => setShowGallery(false)}
  //       onAddPhoto={handleAddPhoto}
  //     />
  //   );
  // }
  if (showGallery) {
    return (
      <PhotoGalleryScreen
        photos={data.photos}
        onBack={() => setShowGallery(false)}
        onSave={(updatedPhotos) => {
          console.log('Новый список фото:', updatedPhotos);
          setShowGallery(false);
        }}
      />
    );
  }
  const handleChoosePhoto = () => {
    fileInputRef.current.click();
  };

  const handleEdit = () => {
    setActiveView('edit');
  };

  const handleSettings = () => {
    setActiveView('settings');
  };

  if (activeView === 'edit') {
    return <ProfileEditScreen onBack={() => setActiveView('main')} data={data} />;
  }

  if (activeView === 'settings') {
    return <SettingsScreen onBack={() => setActiveView('main')} />;
  }

  return (
    <div className={styles.profileContainer}>
      {}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={(e) => console.log("Файл выбран:", e.target.files[0])}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
        <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
      </header>

      <div className={styles.cardArea} onClick={() => setShowGallery(true)} style={{ cursor: 'pointer' }}>
        <img src={data.photos[0]} alt="аватарка" className={styles.avatar} />
        <h3>{data.name}</h3>
        <p className={styles.profileLabel}>Профиль</p>
      </div>
      <div className={styles.profileButtons}>
        <button className={styles.btnIcon} onClick={() => setShowGallery(true)}>
          <img src="/assets/camera.svg" alt="фото" className={styles.btnImg} />
          <span>Выбрать фото</span>
        </button>
        <button className={styles.btnIcon} onClick={handleEdit}>
          <img src="/assets/changing.svg" alt="ред" className={styles.btnImg} />
          <span>Изменить</span>
        </button>
        <button className={styles.btnIcon} onClick={handleSettings}>
          <img src="/assets/properties.svg" alt="настр" className={styles.btnImg} />
          <span>Настройки</span>
        </button>
      </div>
      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>О себе</h3>
        <div className={styles.bioCard}>
          <p>{data.bio}</p>
        </div>
      </div>
      <div className={styles.menuSection}>
        <h3 className={styles.menuTitle}>Основные</h3>
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <img src="/assets/city.svg" alt="" className={styles.infoImg} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{data.city}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <img src="/assets/bandage-outline.svg" alt="" className={styles.infoImg} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Возраст</span>
              <span className={styles.infoValue}>{data.age} лет</span>
            </div>
          </div>
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