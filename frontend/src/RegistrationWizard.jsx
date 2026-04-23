
import React, { useState } from 'react';
import '../css/registration.css'; 
import Test from './Test';
export default function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    privacyAccepted: false,
    ageAccepted: false,
    city: '',
    height: '',
    education: '',
    description: '',
    tags: [],
    photo: null,
  });
  const [showTest, setShowTest] = useState(false);
  const nextStep = () => {
    if (step === 0) {
      if (!userData.name.trim()) { alert('Введите имя'); return; }
      if (!userData.birthDate.trim()) { alert('Введите дату рождения'); return; }
      if (!userData.gender) { alert('Выберите пол'); return; }
    }
    if (step === 2) {
      if (!userData.privacyAccepted) { alert('Примите Политику конфиденциальности'); return; }
      if (!userData.ageAccepted) { alert('Подтвердите возраст 18+'); return; }
    }
    if (step === 3) {
      if (!userData.photo) { alert('Выберите фото'); return; }
    }
    if (step === 5) {
      if (!userData.city.trim()) { alert('Введите город'); return; }
      if (!userData.height.trim()) { alert('Введите рост'); return; }
      if (!userData.education.trim()) { alert('Введите образование'); return; }
    }
    if (step === 6) {
      if (!userData.description.trim()) { alert('Напишите о себе'); return; }
    }
    if (step === 7) {
      if (userData.tags.length === 0) { alert('Выберите хотя бы один тег'); return; }
    }
    setStep(step + 1);
  };

  const toggleTag = (tag) => {
    if (userData.tags.includes(tag)) {
      setUserData({ ...userData, tags: userData.tags.filter(t => t !== tag) });
    } else {
      if (userData.tags.length >= 5) {
        alert('Можно выбрать не более 5 тегов');
        return;
      }
      setUserData({ ...userData, tags: [...userData.tags, tag] });
    }
  };

  const allTags = [
    "альпинизм", "аниме", "архитектура", "астрономия", "автомобили", "бег", "бильярд", "бокс", "велосипед",
    "видеоигры", "волейбол", "волонтёрство", "вязание", "гейминг", "гребля", "дача", "дайвинг", "джаз",
    "живопись", "животные", "йога", "иностранные языки", "кино", "книги", "коллекционирование", "кофе",
    "кошки", "кроссфит", "кулинария", "лыжи", "медитация", "музыка", "настольные игры", "оригами",
    "пешие прогулки", "писательство", "плавание", "психология", "путешествия", "рисование", "рыбалка",
    "садоводство", "сериалы", "сноуборд", "собаки", "спорт", "танцы", "театр", "теннис", "трекинг",
    "туризм", "фитнес", "фортепиано", "фотография", "футбол", "хендмейд", "хоккей", "шахматы"
  ];
  if (showTest) {
    return <Test onFinish={() => setShowTest(false)} />;
  }
  return (
    <div className="main-container">
      <div id="splash" className="splash-container">
        <img className="polydate" src="/assets/polydate.svg" alt="Логотип приложения" />
      </div>

      {}
      <div className={`registration-screen screen ${step === 0 ? 'active' : ''}`}>
        <h2 className="text-title">Добро пожаловать в PolyDate!</h2>
        <div className="fields-group">
          <input type="text" placeholder="Имя" className="field-input" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
          <input type="text" placeholder="Дата рождения" className="field-input" pattern="\d{2}\.\d{2}\.\d{4}" value={userData.birthDate} onChange={e => setUserData({...userData, birthDate: e.target.value})} />
          <div className="gender-selector">
            <div className={`gender-option ${userData.gender === 'male' ? 'active' : ''}`} onClick={() => setUserData({...userData, gender: 'male'})}>
              <div className="gender-circle"><img src="/assets/male_icons.svg" className="gender-icon" width="35" height="46" alt="Мужской" /></div>
              <span>Муж</span>
            </div>
            <div className={`gender-option ${userData.gender === 'female' ? 'active' : ''}`} onClick={() => setUserData({...userData, gender: 'female'})}>
              <div className="gender-circle"><img src="/assets/female_icons.svg" className="gender-icon" width="35" height="46" alt="Женский" /></div>
              <span>Жен</span>
            </div>
          </div>
        </div>
        <button className="next-btn" onClick={nextStep}>Зарегистрироваться</button>
      </div>

      {}
      <div className={`registration-screen-geolocation screen ${step === 1 ? 'active' : ''}`}>
        <img src="/assets/geolocation.svg" alt="иконка геолокации" className="geo-icon" />
        <div className="title-container">
          <img src="/assets/heart-left.svg" alt="сердце" className="heart heart-left" />
          <h2 className="text-title-frame">Найдем партнеров <br />поблизости</h2>
          <img src="/assets/heart-right.svg" alt="сердце" className="heart heart-right" />
        </div>
        <p className="main-text">Разрешите доступ к геолокации — ведь настоящие чувства часто начинаются совсем рядом</p>
        <button className="next-btn" onClick={nextStep}>Далее</button>
      </div>

      {}
      <div className={`registration-screen-terms-of-use screen ${step === 2 ? 'active' : ''}`}>
        <img src="/assets/terms_of_use.svg" alt="иконка условия пользований" className="terms-icon" />
        <div className="title-container">
          <img src="/assets/heart-left.svg" alt="сердце" className="heart heart-left" />
          <h2 className="text-title-frame">Принять условия <br />пользования</h2>
          <img src="/assets/heart-right.svg" alt="сердце" className="heart heart-right" />
        </div>
        <div className="checkbox-container">
          <div className="checkbox-group">
            <input type="checkbox" id="privacyPolicy" className="custom-checkbox" checked={userData.privacyAccepted} onChange={e => setUserData({...userData, privacyAccepted: e.target.checked})} />
            <label htmlFor="privacyPolicy">Я принимаю Политику Конфиденциальности</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" id="ageCheckbox" className="custom-checkbox" checked={userData.ageAccepted} onChange={e => setUserData({...userData, ageAccepted: e.target.checked})} />
            <label htmlFor="ageCheckbox">Я принимаю Пользовательское соглашение и подтверждаю, что мне исполнилось 18 лет</label>
          </div>
        </div>
        <button className="next-btn" onClick={nextStep}>Далее</button>
      </div>

      {}
      <div className={`registration-screen-photo screen ${step === 3 ? 'active' : ''}`}>
        <h2 className="text-title">Добавьте фото</h2>
        <div id="camera-icon" className="upload-area" onClick={() => document.getElementById('photo-input').click()}>
          <img src="/assets/Icon-camera.svg" alt="Иконка камеры" className="Icon-camera" />
        </div>
        <input type="file" id="photo-input" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => setUserData({...userData, photo: e.target.files[0]})} />
        <p className="main-text">Выберите фото с четким лицом, оно понадобится для верификации</p>
        <button className="next-btn" onClick={nextStep}>Далее</button>
      </div>

      {}
      <div className={`registration-screen-moderation-failed screen ${step === 4 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Модерация не пройдена</h2>
          <div className="profile-photo-container">
            <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
          </div>
          <ul className="moderation-list">
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Ваше лицо должно быть хорошо видно</li>
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Вы должны быть одни на фото</li>
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Ваше фото должно соответствовать правилам</li>
          </ul>
          <button className="next-btn" onClick={nextStep}>Понятно</button>
        </div>
      </div>

      {}
      <div className={`registration-screen-description-of-profile screen ${step === 5 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Добавьте описание профиля</h2>
          <div className="profile-photo-container">
            <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
            <p className="main-text">Расскажите о себе:</p>
          </div>
          <input type="text" id="city" name="city" placeholder="Город" maxLength="100" value={userData.city} onChange={e => setUserData({...userData, city: e.target.value})} />
          <input type="text" id="height" name="height" placeholder="Рост" maxLength="100" value={userData.height} onChange={e => setUserData({...userData, height: e.target.value})} />
          <input type="text" id="education" name="education" placeholder="Образование" maxLength="100" value={userData.education} onChange={e => setUserData({...userData, education: e.target.value})} />
          <button className="next-btn" onClick={nextStep}>Далее</button>
        </div>
      </div>

      {}
      <div className={`registration-screen-description-of-profile screen ${step === 6 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Добавьте описание профиля</h2>
          <div className="profile-photo-container">
            <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
            <p className="main-text">Расскажите о себе:</p>
          </div>
          <textarea id="description" placeholder="" maxLength="200" rows="4" value={userData.description} onChange={e => setUserData({...userData, description: e.target.value})} />
          <button className="next-btn" onClick={nextStep}>Далее</button>
        </div>
      </div>

      {}
      <div className={`registration-screen-tags screen ${step === 7 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Выберите теги</h2>
          <p className="main-text">Они помогут найти подходящего вам человека</p>
          <div className="tags-grid">
            {allTags.map(tag => (
              <div key={tag} className={`tag-item ${userData.tags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>
                {tag}
              </div>
            ))}
          </div>
          <button className="next-btn" onClick={nextStep}>Далее</button>
        </div>
      </div>

      {}
      <div className={`registration-screen-test screen ${step === 8 ? 'active' : ''}`}>
        <img src="/assets/hands-with-heart.svg" alt="иконка теста" className="test-photo" />
        <p className="text-title">Пройдите тест</p>
        <p className="main-text">Так мы рассчитаем совместимость с каждым профилем и улучшим подбор</p>
        <button className="next-btn" onClick={() => setShowTest(true)}>Начать</button>
      </div>
    </div>
  );
}