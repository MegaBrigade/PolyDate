import React, { useState } from 'react';
// import './css/recommendations.css';

const mockProfiles = [
  {
    id: 1,
    name: 'Анна',
    age: 25,
    city: 'Москва',
    photos: ['/assets/photo1.jpg', '/assets/photo2.jpg'],
    compatibility: 90,
    description: 'Люблю путешествия и кофе'
  },
  {
    id: 2,
    name: 'Мария',
    age: 28,
    city: 'СПб',
    photos: ['/assets/photo3.jpg'],
    compatibility: 75,
  },
];

export default function RecommendationsScreen() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const currentProfile = profiles[currentProfileIndex];

  const nextPhoto = () => {
    if (currentProfile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % currentProfile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (currentProfile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + currentProfile.photos.length) % currentProfile.photos.length);
    }
  };

  const handleLike = () => {
    alert(`Вы лайкнули ${currentProfile.name}`);
    // Здесь отправить лайк на бэкенд
    nextProfile();
  };

  const handleDislike = () => {
    alert(`Вы дизлайкнули ${currentProfile.name}`);
    // здесь отправить дизлайк
    nextProfile();
  };

  const nextProfile = () => {
    if (currentProfileIndex + 1 < profiles.length) {
      setCurrentProfileIndex(currentProfileIndex + 1);
      setCurrentPhotoIndex(0);
    } else {
      alert('Анкеты закончились');
    }
  };

  if (!currentProfile) return <div>Нет анкет</div>;

  return (
    <div className="recommendations-container">
      <div className="user-info">
        <img src="/assets/filters.svg" alt="фильтры" />
        <span>Фильтры</span>
      </div>

      <div className="card-area">
        {/* Фотография с возможностью перелистывания */}
        <div className="photo-slider">
          <img 
            src={currentProfile.photos[currentPhotoIndex]} 
            alt={`${currentProfile.name}`} 
          />
          {currentProfile.photos.length > 1 && (
            <div className="photo-nav">
              <button onClick={prevPhoto}>◀</button>
              <span>{currentPhotoIndex+1}/{currentProfile.photos.length}</span>
              <button onClick={nextPhoto}>▶</button>
            </div>
          )}
        </div>
        <h3>{currentProfile.name}, {currentProfile.age}</h3>
        <p>{currentProfile.city}</p>
        <div className="compatibility-percentage">
          {currentProfile.compatibility}% совместимости
        </div>
      </div>

      <div className="action-buttons">
        <button className="dislike-btn" onClick={handleDislike}>👎</button>
        <button className="like-btn" onClick={handleLike}>❤️</button>
        <button className="info-btn" onClick={() => alert(`Подробнее о ${currentProfile.name}`)}>📄</button>
        <button className="back-btn" onClick={nextProfile}>Следующий</button>
      </div>

      <div className="filters">
        <span>Фильтр: возраст</span>
        <span>Фильтр: расстояние</span>
        <span>Фильтр: интересы</span>
        <button>Настроить</button>
      </div>
    </div>
  );
}