import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from './BottomNavBar';
import RecommendationsScreen from './RecommendationsScreen';
import ProfileScreen from './ProfileScreen';
import LikesScreen from './LikesScreen';
import MatchScreen from './MatchScreen';
import ProfileModal from './ProfileModal';
import './css/main.css';
import {
  getNextCandidate,
  getWhoLikedMe,
  likeUser,
  dislikeUser,
  getProfile,
  normalizeCandidate,
  normalizeProfile,
} from './api';

export default function MainApp({ userId, onLogout }) {
  const [activeTab, setActiveTab] = useState('recommendations');

  // Управляем скроллом app-main в зависимости от вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const appMain = document.querySelector('.app-main');
    if (!appMain) return;
    if (tab === 'recommendations') {
      appMain.style.overflowY = 'hidden';
    } else {
      appMain.style.overflowY = 'auto';
      appMain.scrollTop = 0;
    }
  };
  const [matchData, setMatchData] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // ── Лента рекомендаций ──────────────────────────────────────
  const [feedProfile, setFeedProfile] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedEmpty, setFeedEmpty] = useState(false);

  // ── Лайки ──────────────────────────────────────────────────
  const [likes, setLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // ── Профиль текущего юзера ─────────────────────────────────
  const [myProfile, setMyProfile] = useState(null);

  // ── Фильтры ─────────────────────────────────────────────────
  const [filters, setFilters] = useState({ minAge: 18, maxAge: 100, gender: 'all' });

  // ── Загрузка следующей анкеты из ленты ─────────────────────
  // Принимает фильтры явным аргументом, чтобы не зависеть от замыкания.
  // ВАЖНО: зависимость только [userId], НЕ [filters] — иначе useEffect
  // запускается дважды при каждом изменении фильтра.
  const loadNextCandidate = useCallback(async (currentFilters) => {
    if (!userId) return;
    const f = currentFilters || {};
    setFeedLoading(true);
    try {
      const res = await getNextCandidate(userId, {
        radiusKm: 50,
        ageMin: f.minAge !== 18 ? f.minAge : undefined,
        ageMax: f.maxAge !== 100 ? f.maxAge : undefined,
        gender: f.gender !== 'all' ? f.gender : undefined,
      });
      if (res.candidate) {
        setFeedProfile(normalizeCandidate(res.candidate));
        setFeedEmpty(false);
      } else {
        setFeedProfile(null);
        setFeedEmpty(true);
      }
    } catch (err) {
      console.error('Ошибка загрузки ленты:', err);
      setFeedProfile(null);
      setFeedEmpty(true);
    } finally {
      setFeedLoading(false);
    }
  }, [userId]);

  // ── Загрузка списка лайков ─────────────────────────────────
  const loadLikes = useCallback(async () => {
    if (!userId) return;
    setLikesLoading(true);
    try {
      const res = await getWhoLikedMe(userId);
      const normalized = (res.users ?? []).map(u => normalizeCandidate(u));
      setLikes(normalized);
    } catch (err) {
      console.error('Ошибка загрузки лайков:', err);
    } finally {
      setLikesLoading(false);
    }
  }, [userId]);

  // ── Загрузка профиля текущего пользователя ─────────────────
  const loadMyProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const raw = await getProfile(userId);
      setMyProfile(normalizeProfile(raw));
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
    }
  }, [userId]);

  // ── Начальная загрузка — только один раз при появлении userId ──
  // Фильтры НЕ в зависимостях: при их изменении перезагрузку
  // делает updateFilters напрямую, без участия этого эффекта.
  useEffect(() => {
    if (!userId) return;
    loadNextCandidate({ minAge: 18, maxAge: 100, gender: 'all' });
    loadMyProfile();
    // Начальное состояние — вкладка рекомендаций, скролл заблокирован
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.style.overflowY = 'hidden';
  }, [userId, loadNextCandidate, loadMyProfile]);

  // Загружаем лайки только при переходе на вкладку
  useEffect(() => {
    if (activeTab === 'matches') {
      loadLikes();
    }
  }, [activeTab, loadLikes]);

  // ── Обработчики свайпов ────────────────────────────────────
  const handleLike = async () => {
    if (!feedProfile) return;
    try {
      const res = await likeUser(userId, feedProfile.id);
      if (res.is_match) {
        setMatchData(feedProfile);
      }
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
    loadNextCandidate(filters);
  };

  const handleDislike = async () => {
    if (!feedProfile) return;
    try {
      await dislikeUser(userId, feedProfile.id);
    } catch (err) {
      console.error('Ошибка дизлайка:', err);
    }
    loadNextCandidate(filters);
  };

  // ── Лайк из экрана «Лайки» ─────────────────────────────────
  const handleLikeInLikes = async (user) => {
    try {
      const res = await likeUser(userId, user.id);
      setLikes(prev =>
        prev.map(item =>
          item.id === user.id ? { ...item, liked: true } : item
        )
      );
      if (res.is_match) {
        setMatchData(user);
      }
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
  };

  const handleDislikeInLikes = async (id) => {
    try {
      await dislikeUser(userId, id);
      setLikes(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Ошибка дизлайка:', err);
    }
  };

  // ── Обновление фильтров — единственная точка изменения + перезагрузка ──
  // newFilters передаётся явно в loadNextCandidate, потому что setFilters
  // асинхронный и state ещё не обновлён в момент вызова.
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    loadNextCandidate(newFilters);
  };

  // ── ProfileModal ───────────────────────────────────────────
  const openProfileModal = (user) => setSelectedProfile(user);
  const closeProfileModal = () => setSelectedProfile(null);

  // ── Контент по вкладкам ────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations': {
        // Показываем лоадер только при самой первой загрузке
        if (feedLoading && !feedProfile && !feedEmpty) {
          return (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#fff'
            }}>
              Загрузка…
            </div>
          );
        }
        // RecommendationsScreen рендерится ВСЕГДА (даже когда анкеты закончились),
        // чтобы кнопка «Фильтры» оставалась доступной.
        // Пустое состояние обрабатывается внутри компонента (ветка !profiles.length).
        return (
          <RecommendationsScreen
            profiles={feedProfile ? [feedProfile] : []}
            currentIndex={0}
            onNextProfile={() => loadNextCandidate(filters)}
            onMatch={(user) => setMatchData(user)}
            onOpenProfile={openProfileModal}
            filters={filters}
            onUpdateFilters={updateFilters}
            onLike={handleLike}
            onDislike={handleDislike}
          />
        );
      }

      case 'profile':
        return (
          <ProfileScreen
            userId={userId}
            userData={myProfile}
            onProfileUpdate={loadMyProfile}
            onLogout={onLogout}
          />
        );

      case 'matches':
        return (
          <LikesScreen
            likes={likes}
            loading={likesLoading}
            onLike={handleLikeInLikes}
            onDislike={handleDislikeInLikes}
            onOpenProfile={openProfileModal}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="main-app">
      {/* {matchData ? (
        <MatchScreen matchUser={matchData} onClose={() => setMatchData(null)} />
      ) : (
        <>
          <div className="app-main">{renderContent()}</div>
          <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {selectedProfile && (
        <ProfileModal user={selectedProfile} onClose={closeProfileModal} />
      )} */}
      {matchData ? (
        <MatchScreen
          matchUser={matchData}
          onClose={() => setMatchData(null)}
          currentUserPhoto={myProfile?.photos?.[0]?.url || '/assets/default-avatar.svg'}
        />
      ) : (
        <>
          <div className="app-main">{renderContent()}</div>
          <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}
