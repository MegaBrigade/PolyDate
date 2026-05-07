import React from 'react';
// import '../css/match.css';

export default function MatchScreen({ matchUser, onClose }) {
  // matchUser – объект с данными пользователя, с которым мэтч
  const user = matchUser || { username: '@MegaBrigade' };

  return (
    <div className="match-container">
      <div className="frame">MATCH!</div>
      <div className="card-area">
        <div>Анкета пользователя 1</div>
        <div>Анкета пользователя 2</div>
      </div>
      <p>
        Собеседник уже ждет знакомства. Откройте контакты собеседника и сделайте первый шаг.
        Кто знает, возможно, это начало чего-то большого?
      </p>
      <div className="frame">{user.username}</div>
      <button onClick={onClose}>Закрыть</button>
    </div>
  );
}