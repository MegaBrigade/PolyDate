import React, { useState } from 'react';
import '../css/registration.css';
import Test from './Test';
import { register, saveUserId, updateTags, uploadPhoto, submitTest } from './api';
import TagsSelectionScreen from './TagsSelectionScreen';
export default function RegistrationWizard({ onComplete, telegramId }) {
  const urlParams = new URLSearchParams(window.location.search);
  // const testStep = urlParams.get('step');
  // const initialStep = testStep ? parseInt(testStep) : 0;
  // const [step, setStep] = useState(initialStep);

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
    latitude: 55.75,
    longitude: 37.62,
  });
  const [showTest, setShowTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    if (step === 0) {
      if (!userData.name.trim()) { alert('Введите имя'); return; }
      if (!userData.birthDate.trim()) { alert('Введите дату рождения'); return; }
      if (!userData.gender) { alert('Выберите пол'); return; }
    }
    if (step === 1) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserData(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }));
          },
          () => {}
        );
      }
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
    }
    if (step === 6) {
      if (!userData.description.trim()) { alert('Напишите о себе'); return; }
    }
    // if (step === 7) {
    //   if (userData.tags.length === 0) { alert('Выберите хотя бы один тег'); return; }
    // }
    setStep(step + 1);
  };

  const toggleTag = (tag) => {
    if (userData.tags.includes(tag)) {
      setUserData({ ...userData, tags: userData.tags.filter(t => t !== tag) });
    } else {
      if (userData.tags.length >= 5) { alert('Можно выбрать не более 5 тегов'); return; }
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
    return (
      <Test
        onFinish={async (testAnswers) => {
          // testAnswers = { 1: score, 2: score, ..., 15: score }
          setShowTest(false);
          setIsSubmitting(true);

          try {
            // 1. Парсим дату рождения (DD.MM.YYYY)
            const [dd, mm, yyyy] = userData.birthDate.split('.');
            const dateOfBirth = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;

            // 2. FIX: добавлен gender в payload
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            const payload = {
              telegram_id: telegramId,
              username: userData.name.toLowerCase().replace(/\s+/g, '_') + '_' + telegramId,
              telegram_username: tgUser?.username || null,
              first_name: userData.name.trim(),
              gender: userData.gender,        // FIX: был пропущен
              date_of_birth: dateOfBirth,
              country: 'RU',
              city: userData.city || 'Москва',
              latitude: userData.latitude,
              longitude: userData.longitude,
              bio: userData.description || null,
            };

            const res = await register(payload);
            const userId = res.user_id || telegramId;
            saveUserId(userId);

            // 3. FIX: загружаем фото (если выбрано)
            if (userData.photo) {
              try {
                await uploadPhoto(userId, userData.photo);
              } catch (photoErr) {
                console.warn('Не удалось загрузить фото:', photoErr);
              }
            }

            // 4. FIX: отправляем теги
            if (userData.tags.length > 0) {
              try {
                await updateTags(userId, userData.tags);
              } catch (tagsErr) {
                console.warn('Не удалось сохранить теги:', tagsErr);
              }
            }

            // 5. FIX: отправляем ответы теста на бэкенд
            try {
              await submitTest(userId, testAnswers);
            } catch (testErr) {
              console.warn('Не удалось сохранить результаты теста:', testErr);
            }

            onComplete(userId);
          } catch (err) {
            console.error('Ошибка регистрации:', err);
            // Если пользователь уже существует — пробуем войти
            onComplete(telegramId);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    );
  }

  if (isSubmitting) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', flexDirection: 'column', gap: '12px',
        background: '#0f0f0f', color: '#fff'
      }}>
        <img src="/assets/polydate.svg" alt="PolyDate" style={{ width: '120px' }} />
        <p style={{ opacity: 0.6, fontSize: '14px' }}>Создаём профиль…</p>
      </div>
    );
  }
  if (step === 7) {
    return (
      <div className="main-container">
        <div className="splash-container">
          <img className="polydate" src="/assets/polydate.svg" alt="Логотип приложения" />
        </div>
        <TagsSelectionScreen
          initialTags={userData.tags}
          onSave={(newTags) => {
            setUserData({ ...userData, tags: newTags });
            setStep(8);   // переход к тесту
          }}
          onBack={() => setStep(6)}
          hideBackButton={true}
        />
      </div>
    );
  }
  return (
    <div className="main-container">
      <div id="splash" className="splash-container">
        <img className="polydate" src="/assets/polydate.svg" alt="Логотип приложения" />
      </div>

      {/* Шаг 0 — Имя, дата рождения, пол */}
      <div className={`registration-screen screen ${step === 0 ? 'active' : ''}`}>
        <h2 className="text-title">Добро пожаловать в PolyDate!</h2>
        <div className="fields-group">
          <input type="text" placeholder="Имя" className="field-input" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
          <input type="text" placeholder="Дата рождения (ДД.ММ.ГГГГ)" className="field-input" value={userData.birthDate} onChange={e => setUserData({...userData, birthDate: e.target.value})} />
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

      {/* Шаг 1 — Геолокация */}
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

      {/* Шаг 2 — Условия */}
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

      {/* Шаг 3 — Фото */}
      <div className={`registration-screen-photo screen ${step === 3 ? 'active' : ''}`}>
        <h2 className="text-title">Добавьте фото</h2>
        <div id="camera-icon" className="upload-area" onClick={() => document.getElementById('photo-input').click()}>
          {userData.photo
            ? <img src={URL.createObjectURL(userData.photo)} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px'}} />
            : <img src="/assets/Icon-camera.svg" alt="Иконка камеры" className="Icon-camera" />
          }
        </div>
        <input type="file" id="photo-input" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => setUserData({...userData, photo: e.target.files[0]})} />
        <p className="main-text">Выберите фото с четким лицом</p>
        <button className="next-btn" onClick={nextStep}>Далее</button>
      </div>

      {/* Шаг 4 — Модерация (информационный экран) */}
      <div className={`registration-screen-moderation-failed screen ${step === 4 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Требования к фото</h2>
          <div className="profile-photo-container">
            {userData.photo
              ? <img className="profile-photo" src={URL.createObjectURL(userData.photo)} alt="Фото профиля" style={{objectFit:'cover'}} />
              : <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
            }
          </div>
          <ul className="moderation-list">
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Ваше лицо должно быть хорошо видно</li>
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Вы должны быть одни на фото</li>
            <li><img src="/assets/heart-icon.svg" alt="сердце" className="list-icon" /> Ваше фото должно соответствовать правилам</li>
          </ul>
          <button className="next-btn" onClick={nextStep}>Понятно</button>
        </div>
      </div>

      {/* Шаг 5 — Город */}
      <div className={`registration-screen-description-of-profile screen ${step === 5 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Добавьте описание профиля</h2>
          <div className="profile-photo-container">
            {userData.photo
              ? <img className="profile-photo" src={URL.createObjectURL(userData.photo)} alt="Фото профиля" style={{objectFit:'cover'}} />
              : <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
            }
            <p className="main-text">Расскажите о себе:</p>
          </div>
          <input type="text" id="city" name="city" placeholder="Город" maxLength="100" value={userData.city} onChange={e => setUserData({...userData, city: e.target.value})} />
          <input type="text" id="height" name="height" placeholder="Рост" maxLength="100" value={userData.height} onChange={e => setUserData({...userData, height: e.target.value})} />
          <input type="text" id="education" name="education" placeholder="Образование" maxLength="100" value={userData.education} onChange={e => setUserData({...userData, education: e.target.value})} />
          <button className="next-btn" onClick={nextStep}>Далее</button>
        </div>
      </div>

      {/* Шаг 6 — О себе */}
      <div className={`registration-screen-description-of-profile screen ${step === 6 ? 'active' : ''}`}>
        <div className="panel">
          <h2 className="text-title">Добавьте описание профиля</h2>
          <div className="profile-photo-container">
            {userData.photo
              ? <img className="profile-photo" src={URL.createObjectURL(userData.photo)} alt="Фото профиля" style={{objectFit:'cover'}} />
              : <img className="profile-photo" src="/assets/profile-photo.svg" alt="Фото профиля" />
            }
            <p className="main-text">Расскажите о себе:</p>
          </div>
          <textarea id="description" placeholder="О себе..." maxLength="200" rows="4" value={userData.description} onChange={e => setUserData({...userData, description: e.target.value})} />
          <button className="next-btn" onClick={nextStep}>Далее</button>
        </div>
      </div>

      {/* Шаг 7 — Теги */}
      
      {/* <div className={`registration-screen-tags screen ${step === 7 ? 'active' : ''}`}>
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
      </div> */}

      {/* Шаг 8 — Тест */}
      <div className={`registration-screen-test screen ${step === 8 ? 'active' : ''}`}>
        <img src="/assets/hands-with-heart.svg" alt="иконка теста" className="test-photo" />
        <p className="text-title">Пройдите тест</p>
        <p className="main-text">Так мы рассчитаем совместимость с каждым профилем и улучшим подбор</p>
        <button className="next-btn" onClick={() => setShowTest(true)}>Начать</button>
      </div>
    </div>
  );
}