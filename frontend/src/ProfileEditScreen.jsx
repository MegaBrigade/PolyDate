import React, { useState } from 'react';
import styles from './css/ProfileEditScreen.module.css';
import { updateProfile } from './api';

export default function ProfileEditScreen({ data, userId, onBack, onSave }) {
  const [form, setForm] = useState({
    first_name: data?.name || '',
    city: data?.city || '',
    bio: data?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!userId) {
      // Если userId не передан — просто закрываем (fallback)
      onBack();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile(userId, form);
      if (onSave) onSave(form);
      onBack();
    } catch (err) {
      setError('Не удалось сохранить: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.editContainer}>
      <div className={styles.editHeader}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <button onClick={handleSave} className={styles.saveBtn} disabled={saving}>
          {saving ? '…' : 'Готово'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ff6b6b', padding: '8px 16px', fontSize: '13px' }}>{error}</p>
      )}

      <div className={styles.form}>
        <label>Имя</label>
        <input
          type="text"
          value={form.first_name}
          onChange={e => setForm({ ...form, first_name: e.target.value })}
        />

        <label>Город</label>
        <input
          type="text"
          value={form.city}
          onChange={e => setForm({ ...form, city: e.target.value })}
        />

        <label>О себе</label>
        <textarea
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          rows="5"
        />
      </div>
    </div>
  );
}
