
import React, { useState } from 'react';
import styles from './css/FiltersModal.module.css';

export default function FiltersModal({ filters, onSave, onClose }) {
  const [minAge, setMinAge] = useState(filters.minAge || 18);
  const [maxAge, setMaxAge] = useState(filters.maxAge || 100);
  const [gender, setGender] = useState(filters.gender || 'all');

  const handleSave = () => {
    onSave({ minAge, maxAge, gender });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h3 className={styles.title}>Фильтры</h3>

        <div className={styles.field}>
          <label>Возраст от</label>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            min={18}
            max={maxAge}
          />
        </div>

        <div className={styles.field}>
          <label>до</label>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value))}
            min={minAge}
            max={100}
          />
        </div>

        <div className={styles.field}>
          <label>Пол</label>
          <div className={styles.genderGroup}>
            <label>
              <input
                type="radio"
                name="gender"
                value="all"
                checked={gender === 'all'}
                onChange={() => setGender('all')}
              /> Любой
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
              /> Женский
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
              /> Мужской
            </label>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave}>Применить</button>
      </div>
    </div>
  );
}