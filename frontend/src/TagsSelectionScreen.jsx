

import React, { useState } from 'react';
import styles from './css/TagsSelectionScreen.module.css';

const allTags = [
  "альпинизм", "аниме", "архитектура", "астрономия", "автомобили", "бег", "бильярд", "бокс", "велосипед",
  "видеоигры", "волейбол", "волонтёрство", "вязание", "гейминг", "гребля", "дача", "дайвинг", "джаз",
  "живопись", "животные", "йога", "иностранные языки", "кино", "книги", "коллекционирование", "кофе",
  "кошки", "кроссфит", "кулинария", "лыжи", "медитация", "музыка", "настольные игры", "оригами",
  "пешие прогулки", "писательство", "плавание", "психология", "путешествия", "рисование", "рыбалка",
  "садоводство", "сериалы", "сноуборд", "собаки", "спорт", "танцы", "театр", "теннис", "трекинг",
  "туризм", "фитнес", "фортепиано", "фотография", "футбол", "хендмейд", "хоккей", "шахматы"
];


export default function TagsSelectionScreen({ initialTags, onSave, onBack, hideBackButton = false }) {
  const [selectedTags, setSelectedTags] = useState(initialTags || []);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        alert('Можно выбрать не более 5 тегов');
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      alert('Выберите хотя бы один тег');
      return;
    }
    onSave(selectedTags);
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Выберите теги</h2>
        <p className={styles.subtitle}>Они помогут найти подходящего вам человека</p>
        <div className={styles.grid}>
          {allTags.map(tag => (
            <div
              key={tag}
              className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </div>
          ))}
        </div>
        <button className={styles.saveBtn} onClick={handleSave}>Сохранить</button>
        {!hideBackButton && (
          <button className={styles.backBtn} onClick={onBack}>Назад</button>
        )}
      </div>
    </div>
  );
}