import { query, tx } from '../database/db.js';
import { ECONOMY } from '../data/economy.js';
import { grant } from './rewardService.js';
import { record } from './eventService.js';
import { gameDate } from '../utils/time.js';

const trim = (v, n = 128) => (typeof v === 'string' ? v.slice(0, n) : null);

// Находит игрока по Telegram ID или создаёт нового со стартовыми ресурсами
export async function ensurePlayer(tg) {
  const existing = await query(
    `UPDATE players SET username = $2, first_name = $3, last_name = $4, photo_url = COALESCE($5, photo_url), last_seen_at = now()
     WHERE telegram_id = $1 RETURNING *`,
    [tg.id, trim(tg.username), trim(tg.first_name), trim(tg.last_name), trim(tg.photo_url, 512)],
  );
  if (existing.rows[0]) return existing.rows[0];

  return tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO players (telegram_id, username, first_name, last_name, photo_url) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (telegram_id) DO UPDATE SET last_seen_at = now() RETURNING *`,
      [tg.id, trim(tg.username), trim(tg.first_name), trim(tg.last_name), trim(tg.photo_url, 512)],
    );
    const p = ins.rows[0];
    await c.query('INSERT INTO player_balances (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [p.id]);
    await grant(c, p.id, 'start', 'start', ECONOMY.start, 'Стартовый подарок');
    return p;
  });
}

// Ежедневный вход: награда один раз в игровой день
export async function dailyLogin(playerId) {
  const day = gameDate().key;
  return tx(async (c) => {
    await record(c, playerId, 'login', day);
    const granted = await grant(c, playerId, 'daily_login', day, ECONOMY.dailyLogin, 'Ежедневный вход');
    return granted ? ECONOMY.dailyLogin : null;
  });
}

export function displayName(p) {
  return p.first_name || p.username || `Игрок ${p.id}`;
}
