import React from 'react';
import styles from './css/ProfileEditScreen.module.css';

export default function ProfileEditScreen({ data, onBack, onSave }) {
  return (
    <div className={styles.editContainer}>
      <div className={styles.editHeader}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <h2>Редактирование</h2>
        <button onClick={onBack} className={styles.saveBtn}>Готово</button>
      </div>
      
      <div className={styles.form}>
        <label>Имя</label>
        <input type="text" defaultValue={data.name} />
        
        <label>Город</label>
        <input type="text" defaultValue={data.city} />
        
        <label>Образование</label>
        <input type="text" defaultValue={data.education} />
        
        <label>О себе</label>
        <textarea defaultValue={data.bio} rows="5" />
      </div>
    </div>
  );
}