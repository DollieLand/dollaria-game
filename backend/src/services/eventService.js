import { gameDate, weekKey } from '../utils/time.js';

// Записывает игровое событие. Событие с тем же ref засчитывается только один раз.
export async function record(client, playerId, type, ref) {
  const day = gameDate().key;
  const res = await client.query(
    `INSERT INTO game_events (player_id, type, ref, day_key, week_key) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (player_id, type, ref) WHERE ref IS NOT NULL DO NOTHING RETURNING id`,
    [playerId, type, String(ref), day, weekKey(day)],
  );
  return res.rowCount > 0;
}
