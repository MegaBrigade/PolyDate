const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body = null, params = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url.toString(), options);

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || err.message || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return res.json();
}

/** Проверить, существует ли пользователь. */
export async function checkUserExists(telegramId) {
  return request('GET', `/auth/exists/${telegramId}`);
}

/** Войти (получить профиль по telegramId). */
export async function login(telegramId) {
  return request('GET', `/auth/login`, null, { telegram_id: telegramId });
}

/** Зарегистрировать нового пользователя. */
export async function register(userData) {
  return request('POST', '/auth/register', userData);
}

/** Получить профиль пользователя. */
export async function getProfile(userId) {
  return request('GET', `/profile/${userId}`);
}

/** Обновить профиль. */
export async function updateProfile(userId, updateData) {
  return request('PUT', `/profile/${userId}`, updateData);
}

/** Обновить теги (до 5 штук). */
export async function updateTags(userId, tags) {
  return request('POST', `/profile/${userId}/tags`, tags);
}

/**
 * Загрузить фото профиля (multipart/form-data).
 * @param {number} userId
 * @param {File} file
 */
export async function uploadPhoto(userId, file) {
  const url = new URL(`${BASE_URL}/profile/${userId}/photos`, window.location.origin);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
    // НЕ ставим Content-Type — браузер сам выставит multipart/form-data с boundary
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || err.message || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Удалить фото профиля.
 * @param {number} userId
 * @param {number} photoId
 */
export async function deletePhoto(userId, photoId) {
  return request('DELETE', `/profile/${userId}/photos/${photoId}`);
}


/**
 * Отправить ответы на тест OCEAN.
 * @param {number} userId
 * @param {Object} answers — { 1: 5, 2: 4, ..., 15: 3 }
 */
export async function submitTest(userId, answers) {
  return request('POST', '/test/submit', { user_id: userId, answers });
}

/** Получить следующую анкету из ленты. */
export async function getNextCandidate(userId, { radiusKm = 50, ageMin, ageMax, gender } = {}) {
  return request('GET', '/feed/next-candidate', null, {
    user_id: userId,
    radius_km: radiusKm,
    age_min: ageMin,
    age_max: ageMax,
    gender,
  });
}

/** Получить список пользователей, которые лайкнули текущего. */
export async function getWhoLikedMe(userId) {
  return request('GET', '/feed/who-liked-me', null, { user_id: userId });
}

/** Поставить лайк. */
export async function likeUser(userId, candidateId) {
  return request('POST', '/swipe/like', { candidate_id: candidateId, action: 'like' }, { user_id: userId });
}

/** Поставить дизлайк. */
export async function dislikeUser(userId, candidateId) {
  return request('POST', '/swipe/dislike', { candidate_id: candidateId, action: 'dislike' }, { user_id: userId });
}

const USER_ID_KEY = 'polydate_user_id';

/** Получить Telegram ID из WebApp или localStorage (для веб-тестирования). */
export function getTelegramId() {
  try {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.id) return tg.id;
  } catch (_) {}
  const stored = localStorage.getItem(USER_ID_KEY);
  return stored ? Number(stored) : null;
}

/** Сохранить user_id в localStorage. */
export function saveUserId(userId) {
  localStorage.setItem(USER_ID_KEY, String(userId));
}

/** Удалить сохранённый user_id (выход из аккаунта). */
export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

/** Нормализовать кандидата из ответа бэкенда в формат, понятный компонентам. */
export function normalizeCandidate(raw) {
  if (!raw) return null;
  return {
    id: raw.user_id ?? raw.id,
    name: raw.first_name ?? raw.name ?? 'Пользователь',
    age: raw.age ?? '?',
    bio: raw.bio ?? '',
    city: raw.city ?? '',
    education: raw.education ?? '',
    height: raw.height ?? '',
    photos: Array.isArray(raw.photos) && raw.photos.length > 0
      ? raw.photos
      : ['/assets/profile-photo.svg'],
    // FIX: бэкенд возвращает compatibility_percentage, а не compatibility_score
    compatibility: Math.round(raw.compatibility_percentage ?? raw.compatibility_score ?? raw.compatibility ?? 0),
    tags: raw.tags ?? [],
    isMutual: raw.is_mutual ?? false,
  };
}

/** Нормализовать пользователя из ответа /profile/{id} */
export function normalizeProfile(raw) {
  if (!raw) return null;
  // photos может быть [{id, url}] или [url] (обратная совместимость)
  const rawPhotos = Array.isArray(raw.photos) ? raw.photos : [];
  const photos = rawPhotos.length > 0
    ? rawPhotos.map(p => (typeof p === 'string' ? { id: null, url: p } : p))
    : [{ id: null, url: '/assets/profile-photo.svg' }];
  return {
    id: raw.id,
    name: raw.first_name ?? 'Я',
    age: raw.age ?? '?',
    bio: raw.bio ?? '',
    city: raw.city ?? '',
    education: raw.education ?? '',
    height: raw.height ?? '',
    is_visible: raw.is_visible ?? true,
    photos,
    tags: raw.tags ?? [],
  };
}
