import { query, tx } from '../database/db.js';
import { MISSIONS } from '../data/missions.js';
import { gameDate, weekKey, msUntilNextGameDay, activeCollection } from '../utils/time.js';
import { grant, balances } from './rewardService.js';
import { GameError } from '../utils/errors.js';

function periodKey(period) {
  const day = gameDate().key;
  if (period === 'day') return `d:${day}`;
  if (period === 'week') return weekKey(day);
  return 'season';
}

async function progressFor(playerId) {
  const day = gameDate().key;
  const week = weekKey(day);
  const { rows } = await query(
    `SELECT type,
       count(*) FILTER (WHERE day_key = $2) AS day,
       count(*) FILTER (WHERE week_key = $3) AS week,
       count(*) AS season
     FROM game_events WHERE player_id = $1 GROUP BY type`,
    [playerId, day, week],
  );
  const map = new Map(rows.map((r) => [r.type, r]));
  return (event, period) => Number(map.get(event)?.[period] || 0);
}

export async function listMissions(playerId) {
  const progress = await progressFor(playerId);
  const { rows } = await query('SELECT mission_id, period_key FROM mission_claims WHERE player_id = $1', [playerId]);
  const claimed = new Set(rows.map((r) => `${r.mission_id}|${r.period_key}`));
  const items = MISSIONS.map((m) => {
    const value = progress(m.event, m.period);
    const isClaimed = claimed.has(`${m.id}|${periodKey(m.period)}`);
    return {
      id: m.id, period: m.period, title: m.title, goal: m.goal, reward: m.reward,
      progress: Math.min(value, m.goal), done: value >= m.goal, claimed: isClaimed,
    };
  });
  const col = activeCollection(gameDate().key);
  return {
    missions: items,
    claimable: items.filter((i) => i.done && !i.claimed).length,
    resetsInMs: msUntilNextGameDay(),
    weekEndsOn: col.endsOn,
  };
}

export async function claimMission(playerId, missionId) {
  const m = MISSIONS.find((x) => x.id === missionId);
  if (!m) throw new GameError('Задание не найдено', 404, 'not_found');
  const progress = await progressFor(playerId);
  if (progress(m.event, m.period) < m.goal) throw new GameError('Задание ещё не выполнено', 409, 'not_done');
  const key = periodKey(m.period);
  return tx(async (c) => {
    const ins = await c.query(
      'INSERT INTO mission_claims (player_id, mission_id, period_key) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING 1',
      [playerId, m.id, key],
    );
    if (ins.rowCount === 0) throw new GameError('Награда уже получена', 409, 'already_claimed');
    await grant(c, playerId, 'mission', `${m.id}|${key}`, m.reward, `Задание: ${m.title}`);
    return { reward: m.reward, balances: await balances(c, playerId) };
  });
}
