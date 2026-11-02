import { initData } from './telegram.js';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const DEV_USER = import.meta.env.VITE_DEV_USER;

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

async function request(method, path, body) {
  const headers = { 'content-type': 'application/json' };
  const data = initData();
  if (data) headers.authorization = `tma ${data}`;
  else if (DEV_USER) headers['x-dev-user'] = DEV_USER;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.', 0, 'network');
  }
  let json = null;
  try { json = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) throw new ApiError(json?.error || 'Сервер не ответил. Попробуйте ещё раз.', res.status, json?.code);
  return json;
}

export const api = {
  me: () => request('GET', '/me'),
  level: () => request('GET', '/level'),
  word: (level, word) => request('POST', '/level/word', { level, word }),
  hint: (level, kind) => request('POST', '/level/hint', { level, kind }),
  gacha: () => request('GET', '/gacha'),
  openGift: (requestId) => request('POST', '/gacha/open', { requestId }),
  gachaHistory: () => request('GET', '/gacha/history'),
  exchange: (requestId) => request('POST', '/gacha/exchange', { requestId }),
  collection: () => request('GET', '/collection'),
  calendar: () => request('GET', '/calendar'),
  claimCalendar: () => request('POST', '/calendar/claim'),
  missions: () => request('GET', '/missions'),
  claimMission: (missionId) => request('POST', '/missions/claim', { missionId }),
  leaderboard: () => request('GET', '/leaderboard'),
  profile: () => request('GET', '/profile'),
};
