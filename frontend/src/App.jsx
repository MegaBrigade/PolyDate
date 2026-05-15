import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import RegistrationWizard from './RegistrationWizard';
import MainApp from './MainApp';
import { getTelegramId, checkUserExists, login, saveUserId, clearUserId } from './api';

/**
 * Состояния приложения:
 *   splash       → показываем заставку
 *   checking     → проверяем, зарегистрирован ли пользователь
 *   registration → новый пользователь — запускаем визард
 *   app          → пользователь авторизован, главный экран
 *   error        → нет Telegram ID и нет сохранённого — просим открыть через Telegram
 */

export default function App() {
  const [phase, setPhase] = useState('splash');
  const [userId, setUserId] = useState(null);

  // После сплэш-экрана запускаем проверку авторизации
  const handleSplashFinish = async () => {
    setPhase('checking');

    const telegramId = getTelegramId();

    if (!telegramId) {
      setPhase('error');
      return;
    }

    try {
      const { exists } = await checkUserExists(telegramId);

      if (exists) {
        const { user_id } = await login(telegramId);
        saveUserId(user_id);
        setUserId(user_id);
        setPhase('app');
      } else {
        setUserId(telegramId);
        setPhase('registration');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const stored = localStorage.getItem('polydate_user_id');
      if (stored) {
        setUserId(Number(stored));
        setPhase('app');
      } else {
        setPhase('error');
      }
    }
  };

  // Вызывается RegistrationWizard после успешной регистрации
  const handleRegistrationComplete = (registeredUserId) => {
    saveUserId(registeredUserId);
    setUserId(registeredUserId);
    setPhase('app');
  };

  // Выход из аккаунта — очищаем всё и возвращаемся на сплэш
  const handleLogout = () => {
    clearUserId();
    setUserId(null);
    setPhase('splash');
  };

  // ── Рендер ──────────────────────────────────────────────────
  if (phase === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (phase === 'checking') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', flexDirection: 'column', gap: '12px',
        background: '#0f0f0f', color: '#fff'
      }}>
        <img src="/assets/polydate.svg" alt="PolyDate" style={{ width: '120px' }} />
        <p style={{ opacity: 0.6, fontSize: '14px' }}>Загрузка…</p>
      </div>
    );
  }

  if (phase === 'registration') {
    return (
      <RegistrationWizard
        telegramId={userId}
        onComplete={handleRegistrationComplete}
      />
    );
  }

  if (phase === 'error') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', flexDirection: 'column', gap: '16px',
        background: '#0f0f0f', color: '#fff', padding: '24px', textAlign: 'center'
      }}>
        <img src="/assets/polydate.svg" alt="PolyDate" style={{ width: '120px' }} />
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Пожалуйста, откройте приложение через Telegram бота.
        </p>

        {/* DEV-режим: ввести ID вручную */}
        {import.meta.env.DEV && (
          <DevLogin onLogin={(id) => {
            saveUserId(id);
            setUserId(id);
            setPhase('app');
          }} />
        )}
      </div>
    );
  }

  // phase === 'app'
  return <MainApp userId={userId} onLogout={handleLogout} />;
}

// Маленький компонент для dev-режима — вводим Telegram ID вручную
function DevLogin({ onLogin }) {
  const [val, setVal] = React.useState('');
  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '240px' }}>
      <p style={{ fontSize: '12px', color: '#aaa' }}>DEV: введите Telegram ID</p>
      <input
        type="number"
        placeholder="123456789"
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{
          padding: '10px', borderRadius: '8px', border: '1px solid #444',
          background: '#1a1a1a', color: '#fff', fontSize: '14px'
        }}
      />
      <button
        onClick={() => val && onLogin(Number(val))}
        style={{
          padding: '10px', borderRadius: '8px', background: '#e74c8f',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px'
        }}
      >
        Войти
      </button>
    </div>
  );
}

// import React from 'react';
// import RegistrationWizard from './RegistrationWizard';

// function App() {
//   // Передаём заглушку для telegramId (для вёрстки не важно)
//   return <RegistrationWizard onComplete={() => console.log('completed')} telegramId={123456} />;
// }

// export default App;