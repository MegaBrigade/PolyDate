import React from 'react';
// import '../css/profile.css';

export default function ProfileScreen({ userData }) {
  // userData может передаваться из родителя (App)
  const mockUser = {
    name: 'Иван',
    age: 27,
    city: 'Москва',
    height: 180,
    education: 'Высшее',
    photos: ['/assets/avatar.jpg']
  };
  const data = userData || mockUser;

  return (
    <div className="profile-container">
      <div className="user-info">
        <img src="/assets/invite.svg" alt="пригласить" />
        <span>Пригласить</span>
      </div>
      <div className="card-area">
        <img src={data.photos[0]} alt="фото профиля" />
        <h3>{data.name}</h3>
        <p>Профиль</p>
      </div>
      <div className="profile-buttons">
        <button>Выбрать фото</button>
        <button>Изменить</button>
        <button>Настройки</button>
      </div>
      <div className="text-menu">
        <p>
          Основные
          <span>{data.city}</span>
          <span>{data.age} лет</span>
          <span>{data.height} см</span>
          <span>{data.education}</span>
        </p>
      </div>
    </div>
  );
}