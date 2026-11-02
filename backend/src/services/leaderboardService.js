import { query } from '../database/db.js';
import { SCORE_SQL } from './collectionService.js';
import { contestEnd, isContestOver } from '../utils/time.js';
import { displayName } from './playerService.js';

// Места: больше очков → выше. При равенстве очков выше тот, у кого больше уникальных кукол,
// а затем тот, кто набрал этот результат раньше.
const RANKED = `
  SELECT s.*, RANK() OVER (ORDER BY s.points DESC, s.unique_dolls DESC, s.reached_at ASC) AS place
  FROM (${SCORE_SQL}) s WHERE s.points > 0`;

const row = (r) => ({
  place: Number(r.place),
  playerId: r.player_id,
  name: displayName(r),
  photoUrl: r.photo_url,
  points: r.points,
  uniqueDolls: r.unique_dolls,
  setsDone: r.sets_done,
});

export async function leaderboard(playerId, limit = 50) {
  const end = contestEnd();
  const top = await query(`SELECT * FROM (${RANKED}) r ORDER BY place, player_id LIMIT $2`, [end, limit]);
  const me = await query(`SELECT * FROM (${RANKED}) r WHERE player_id = $2`, [end, playerId]);
  const total = await query(`SELECT count(*)::int AS n FROM (${RANKED}) r`, [end]);
  return {
    contestEnd: end.toISOString(),
    contestOver: isContestOver(),
    totalPlayers: total.rows[0].n,
    top: top.rows.map(row),
    me: me.rows[0] ? row(me.rows[0]) : null,
  };
}

export async function placeOf(playerId) {
  const me = await query(`SELECT place FROM (${RANKED}) r WHERE player_id = $2`, [contestEnd(), playerId]);
  return me.rows[0] ? Number(me.rows[0].place) : null;
}
