import { query, tx } from '../database/db.js';
import { CALENDAR_REWARDS, CALENDAR_YEAR, CALENDAR_MONTH } from '../data/calendar.js';
import { gameDate } from '../utils/time.js';
import { grant, balances } from './rewardService.js';
import { record } from './eventService.js';
import { GameError } from '../utils/errors.js';

// Какой день календаря сейчас: 1–31 в декабре 2026, иначе null
function todayDay() {
  const d = gameDate();
  if (d.year === CALENDAR_YEAR && d.month === CALENDAR_MONTH) return d.day;
  return null;
}

function seasonState() {
  const d = gameDate();
  const ym = d.year * 100 + d.month;
  const target = CALENDAR_YEAR * 100 + CALENDAR_MONTH;
  if (ym < target) return 'before';
  if (ym > target) return 'after';
  return 'active';
}

export async function getCalendar(playerId) {
  const { rows } = await query('SELECT day, reward, claimed_at FROM calendar_claims WHERE player_id = $1', [playerId]);
  const claimed = new Map(rows.map((r) => [r.day, r]));
  const today = todayDay();
  const season = seasonState();
  const dollNames = await dollNameMap();
  return {
    season,
    today,
    days: CALENDAR_REWARDS.map((d) => {
      let status = 'future';
      if (claimed.has(d.day)) status = 'claimed';
      else if (season === 'after' || (today && d.day < today)) status = 'missed';
      else if (today === d.day) status = 'today';
      return {
        day: d.day,
        special: d.special,
        status,
        // Содержимое подарка показываем после открытия (и для пропущенных дней)
        reward: status === 'claimed' || status === 'missed' ? describe(d.reward, dollNames) : null,
      };
    }),
  };
}

async function dollNameMap() {
  const { rows } = await query('SELECT id, name FROM dolls');
  return new Map(rows.map((r) => [r.id, r.name]));
}

function describe(reward, names) {
  return { ...reward, dollName: reward.doll ? names.get(reward.doll) || null : undefined };
}

export async function claimToday(playerId) {
  const day = todayDay();
  if (!day) throw new GameError('Календарь работает с 1 по 31 декабря', 409, 'not_active');
  const entry = CALENDAR_REWARDS.find((d) => d.day === day);
  return tx(async (c) => {
    const ins = await c.query(
      'INSERT INTO calendar_claims (player_id, day, reward) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING day',
      [playerId, day, entry.reward],
    );
    if (ins.rowCount === 0) throw new GameError('Подарок этого дня уже получен', 409, 'already_claimed');
    await grant(c, playerId, 'calendar', day, entry.reward, `Календарь: ${day} декабря`);
    let doll = null;
    if (entry.reward.doll) {
      const d = (await c.query('SELECT * FROM dolls WHERE id = $1', [entry.reward.doll])).rows[0];
      if (d) {
        const r = await c.query(
          `INSERT INTO player_dolls (player_id, doll_id) VALUES ($1,$2)
           ON CONFLICT (player_id, doll_id) DO NOTHING RETURNING doll_id`, [playerId, d.id]);
        if (r.rowCount) await record(c, playerId, 'new_doll', d.id);
        doll = { id: d.id, name: d.name, description: d.description, points: d.points, category: d.category };
      }
    }
    await record(c, playerId, 'calendar_claim', day);
    return { day, reward: entry.reward, doll, balances: await balances(c, playerId) };
  });
}
