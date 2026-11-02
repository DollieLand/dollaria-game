import crypto from 'node:crypto';
import { GameError } from '../utils/errors.js';

const clean = (r = {}) => ({
  snowflakes: Math.trunc(r.snowflakes || 0),
  tickets: Math.trunc(r.tickets || 0),
  ribbons: Math.trunc(r.ribbons || 0),
});

// Начисление награды. Одна и та же награда (source + ref) выдаётся игроку только один раз —
// это гарантирует уникальный индекс в таблице reward_ledger.
// Возвращает true, если награда выдана сейчас, и false, если была выдана раньше.
export async function grant(client, playerId, source, ref, reward, note = null) {
  const r = clean(reward);
  const ins = await client.query(
    `INSERT INTO reward_ledger (player_id, source, source_ref, snowflakes, tickets, ribbons, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (player_id, source, source_ref) DO NOTHING RETURNING id`,
    [playerId, source, String(ref), r.snowflakes, r.tickets, r.ribbons, note],
  );
  if (ins.rowCount === 0) return false;
  await client.query(
    `UPDATE player_balances SET snowflakes = snowflakes + $2, tickets = tickets + $3, ribbons = ribbons + $4, updated_at = now()
     WHERE player_id = $1`,
    [playerId, r.snowflakes, r.tickets, r.ribbons],
  );
  return true;
}

// Списание. Если ресурса не хватает — ничего не списывается и игрок видит понятную ошибку.
export async function spend(client, playerId, source, cost, note = null, ref = crypto.randomUUID()) {
  const c = clean(cost);
  const upd = await client.query(
    `UPDATE player_balances SET snowflakes = snowflakes - $2, tickets = tickets - $3, ribbons = ribbons - $4, updated_at = now()
     WHERE player_id = $1 AND snowflakes >= $2 AND tickets >= $3 AND ribbons >= $4 RETURNING player_id`,
    [playerId, c.snowflakes, c.tickets, c.ribbons],
  );
  if (upd.rowCount === 0) {
    const what = c.tickets ? 'подарочных билетов' : c.ribbons ? 'лент' : 'снежинок';
    throw new GameError(`Не хватает ${what}`, 400, 'not_enough');
  }
  await client.query(
    `INSERT INTO reward_ledger (player_id, source, source_ref, snowflakes, tickets, ribbons, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [playerId, source, String(ref), -c.snowflakes, -c.tickets, -c.ribbons, note],
  );
}

export async function balances(client, playerId) {
  const { rows } = await client.query('SELECT snowflakes, tickets, ribbons FROM player_balances WHERE player_id = $1', [playerId]);
  return rows[0] || { snowflakes: 0, tickets: 0, ribbons: 0 };
}
