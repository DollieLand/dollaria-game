import { query } from '../database/db.js';
import { allDolls, categoryTitle } from './catalogService.js';
import { record } from './eventService.js';
import { contestEnd } from '../utils/time.js';

// Проверяет, собран ли набор полностью, и записывает событие «набор собран» (один раз)
export async function checkSetComplete(c, playerId, collectionId) {
  const { rows } = await c.query(
    `SELECT
       (SELECT count(*) FROM dolls WHERE collection_id = $2 AND active) AS total,
       (SELECT count(*) FROM player_dolls pd JOIN dolls d ON d.id = pd.doll_id
         WHERE pd.player_id = $1 AND d.collection_id = $2 AND d.active) AS owned`,
    [playerId, collectionId],
  );
  const { total, owned } = rows[0];
  if (Number(total) > 0 && Number(owned) >= Number(total)) {
    return record(c, playerId, 'set_complete', collectionId);
  }
  return false;
}

// Коллекционные очки игрока. Считаются только куклы, полученные до конца конкурса.
// Очки = очки каждой уникальной куклы + бонус за каждый полностью собранный набор.
export const SCORE_SQL = `
  WITH owned AS (
    SELECT pd.player_id, d.id, d.points, d.collection_id, pd.first_obtained_at
    FROM player_dolls pd JOIN dolls d ON d.id = pd.doll_id
    WHERE d.active AND pd.first_obtained_at <= $1
  ),
  totals AS (
    SELECT d.collection_id, count(*) AS n FROM dolls d JOIN collections c ON c.id = d.collection_id
    WHERE d.active AND c.in_gacha GROUP BY d.collection_id
  ),
  sets AS (
    SELECT o.player_id, o.collection_id, max(o.first_obtained_at) AS done_at
    FROM owned o JOIN totals t ON t.collection_id = o.collection_id
    GROUP BY o.player_id, o.collection_id, t.n HAVING count(*) = t.n
  ),
  set_points AS (
    SELECT s.player_id, sum(c.set_bonus) AS bonus, count(*) AS sets_done, max(s.done_at) AS last_set
    FROM sets s JOIN collections c ON c.id = s.collection_id GROUP BY s.player_id
  ),
  doll_points AS (
    SELECT player_id, sum(points) AS pts, count(*) AS uniq, max(first_obtained_at) AS last_doll
    FROM owned GROUP BY player_id
  )
  SELECT p.id AS player_id, p.first_name, p.username, p.photo_url,
         (dp.pts + COALESCE(sp.bonus, 0))::int AS points,
         dp.uniq::int AS unique_dolls,
         COALESCE(sp.sets_done, 0)::int AS sets_done,
         GREATEST(dp.last_doll, COALESCE(sp.last_set, dp.last_doll)) AS reached_at
  FROM doll_points dp
  JOIN players p ON p.id = dp.player_id
  LEFT JOIN set_points sp ON sp.player_id = dp.player_id`;

export async function playerScore(playerId) {
  const { rows } = await query(`SELECT * FROM (${SCORE_SQL}) s WHERE player_id = $2`, [contestEnd(), playerId]);
  return rows[0] || { points: 0, unique_dolls: 0, sets_done: 0 };
}

export async function playerCollection(playerId) {
  const dolls = await allDolls();
  const { rows: owned } = await query('SELECT doll_id, copies, first_obtained_at FROM player_dolls WHERE player_id = $1', [playerId]);
  const map = new Map(owned.map((o) => [o.doll_id, o]));

  const collections = new Map();
  const list = dolls.map((d) => {
    const o = map.get(d.id);
    if (!collections.has(d.collection_id)) {
      collections.set(d.collection_id, { id: d.collection_id, title: d.collection_title, total: 0, owned: 0 });
    }
    const col = collections.get(d.collection_id);
    col.total++;
    if (o) col.owned++;
    return {
      id: d.id,
      collectionId: d.collection_id,
      collectionTitle: d.collection_title,
      // У неполученных кукол имя и описание скрыты — показываем силуэт
      name: o ? d.name : null,
      description: o ? d.description : null,
      category: d.category,
      categoryTitle: categoryTitle(d.category),
      points: d.points,
      owned: !!o,
      copies: o ? o.copies : 0,
      obtainedAt: o ? o.first_obtained_at : null,
    };
  });
  const { rows: meta } = await query('SELECT id, set_bonus, in_gacha FROM collections');
  const metaMap = new Map(meta.map((b) => [b.id, b]));
  const cols = [...collections.values()].map((c) => ({
    ...c,
    setBonus: metaMap.get(c.id)?.set_bonus || 0,
    isSet: !!metaMap.get(c.id)?.in_gacha,
    complete: !!metaMap.get(c.id)?.in_gacha && c.owned === c.total,
  }));
  const score = await playerScore(playerId);
  return {
    dolls: list,
    collections: cols,
    stats: {
      owned: list.filter((d) => d.owned).length,
      total: list.length,
      points: score.points || 0,
      setsDone: cols.filter((c) => c.complete).length,
    },
  };
}
