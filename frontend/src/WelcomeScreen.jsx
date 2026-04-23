import React, { useState } from 'react';
import '/css/registration.css';
export default function WelcomeScreen({ onNext, userData, setUserData }) {
  const [name, setName] = useState(userData.name || '');
  const [birthDate, setBirthDate] = useState(userData.birthDate || '');
  const [gender, setGender] = useState(userData.gender || '');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!name.trim()) return setError('Введите имя');
    if (!birthDate.trim()) return setError('Введите дату рождения');
    if (!gender) return setError('Выберите пол');
    setUserData({ ...userData, name, birthDate, gender });
    onNext();
  };

  return (
    <div className="screen active">
      <h2 className="text-title">Добро пожаловать в PolyDate!</h2>
      <div className="fields-group">
        <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} className="field-input" />
        <input type="text" placeholder="Дата рождения" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="field-input" pattern="\d{2}\.\d{2}\.\d{4}" />
        <div className="gender-selector">
          <div className={`gender-option ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>
            <div className="gender-circle"><img src="/src/assets/male_icons.svg" className="gender-icon" width="35" height="46" alt="Мужской" /></div>
            <span>Муж</span>
          </div>
          <div className={`gender-option ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>
            <div className="gender-circle"><img src="/src/assets/female_icons.svg" className="gender-icon" width="35" height="46" alt="Женский" /></div>
            <span>Жен</span>
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <button className="next-btn" onClick={handleNext}>Зарегистрироваться</button>
    </div>
  );
}