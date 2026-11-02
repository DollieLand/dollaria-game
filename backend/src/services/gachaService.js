import crypto from 'node:crypto';
import { query, tx } from '../database/db.js';
import { ECONOMY } from '../data/economy.js';
import { activeCollection, gameDate } from '../utils/time.js';
import { grant, spend, balances } from './rewardService.js';
import { record } from './eventService.js';
import { checkSetComplete } from './collectionService.js';
import { categoryTitle } from './catalogService.js';
import { GameError } from '../utils/errors.js';

async function bannerDolls(collectionId) {
  const { rows } = await query(
    'SELECT * FROM dolls WHERE collection_id = $1 AND active AND weight > 0 ORDER BY sort',
    [collectionId],
  );
  return rows;
}

// Витрина недели с точными шансами — те же числа сервер использует при открытии подарка
export async function currentBanner(playerId) {
  const col = activeCollection(gameDate().key);
  const dolls = await bannerDolls(col.id);
  const total = dolls.reduce((s, d) => s + d.weight, 0);
  const { rows: owned } = await query('SELECT doll_id FROM player_dolls WHERE player_id = $1', [playerId]);
  const ownedSet = new Set(owned.map((o) => o.doll_id));
  return {
    collection: { id: col.id, title: col.title, startsOn: col.startsOn, endsOn: col.endsOn, setBonus: col.setBonus },
    cost: ECONOMY.gachaCost,
    ribbonExchange: ECONOMY.ribbonExchange,
    dolls: dolls.map((d) => ({
      id: d.id,
      name: ownedSet.has(d.id) ? d.name : null,
      category: d.category,
      categoryTitle: categoryTitle(d.category),
      points: d.points,
      duplicateRibbons: d.duplicate_ribbons,
      chance: total ? Math.round((d.weight / total) * 1000) / 10 : 0,
      owned: ownedSet.has(d.id),
    })),
  };
}

function dollView(d) {
  return {
    id: d.id, name: d.name, description: d.description, category: d.category,
    categoryTitle: categoryTitle(d.category), points: d.points, collectionId: d.collection_id,
  };
}

export async function openGift(player, requestId) {
  return tx(async (c) => {
    // Повтор того же запроса (например, плохая связь) возвращает уже выпавший результат
    const prev = await c.query('SELECT * FROM gacha_history WHERE player_id = $1 AND request_id = $2', [player.id, requestId]);
    if (prev.rows[0]) {
      const h = prev.rows[0];
      const d = (await c.query('SELECT * FROM dolls WHERE id = $1', [h.doll_id])).rows[0];
      return { doll: dollView(d), duplicate: h.was_duplicate, ribbons: h.ribbons_awarded, setCompleted: false, balances: await balances(c, player.id), repeated: true };
    }

    const col = activeCollection(gameDate().key);
    const dolls = await bannerDolls(col.id);
    const total = dolls.reduce((s, d) => s + d.weight, 0);
    if (!total) throw new GameError('В этой коллекции пока нет кукол', 409, 'empty_banner');

    await spend(c, player.id, 'gacha', { tickets: ECONOMY.gachaCost }, `Подарок: ${col.title}`, requestId);

    // Случайность на сервере — криптографически стойкий генератор
    let roll = crypto.randomInt(total);
    let doll = dolls[dolls.length - 1];
    for (const d of dolls) { if (roll < d.weight) { doll = d; break; } roll -= d.weight; }

    const existing = await c.query('SELECT copies FROM player_dolls WHERE player_id = $1 AND doll_id = $2 FOR UPDATE', [player.id, doll.id]);
    const duplicate = existing.rowCount > 0;
    let ribbons = 0;
    let setCompleted = false;
    if (duplicate) {
      await c.query('UPDATE player_dolls SET copies = copies + 1, last_obtained_at = now() WHERE player_id = $1 AND doll_id = $2', [player.id, doll.id]);
      ribbons = doll.duplicate_ribbons;
      await grant(c, player.id, 'duplicate', requestId, { ribbons }, `Дубликат: ${doll.name}`);
    } else {
      await c.query('INSERT INTO player_dolls (player_id, doll_id) VALUES ($1,$2)', [player.id, doll.id]);
      await record(c, player.id, 'new_doll', doll.id);
      setCompleted = await checkSetComplete(c, player.id, doll.collection_id);
    }
    await record(c, player.id, 'gacha_open', requestId);
    await c.query(
      `INSERT INTO gacha_history (player_id, request_id, collection_id, doll_id, was_duplicate, ribbons_awarded)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [player.id, requestId, col.id, doll.id, duplicate, ribbons],
    );
    return { doll: dollView(doll), duplicate, ribbons, setCompleted, balances: await balances(c, player.id) };
  });
}

export async function history(playerId) {
  const { rows } = await query(
    `SELECT h.created_at, h.was_duplicate, h.ribbons_awarded, d.id, d.name, d.category, c.title AS collection_title
     FROM gacha_history h JOIN dolls d ON d.id = h.doll_id JOIN collections c ON c.id = h.collection_id
     WHERE h.player_id = $1 ORDER BY h.id DESC LIMIT 50`,
    [playerId],
  );
  return rows.map((r) => ({
    at: r.created_at, dollId: r.id, name: r.name, category: r.category, categoryTitle: categoryTitle(r.category),
    collectionTitle: r.collection_title, duplicate: r.was_duplicate, ribbons: r.ribbons_awarded,
  }));
}

export async function exchangeRibbons(player, requestId) {
  const { ribbons, tickets } = ECONOMY.ribbonExchange;
  return tx(async (c) => {
    const done = await c.query(`SELECT 1 FROM reward_ledger WHERE player_id = $1 AND source = 'ribbon_exchange' AND source_ref = $2`, [player.id, requestId]);
    if (done.rowCount === 0) {
      await spend(c, player.id, 'ribbon_exchange_cost', { ribbons }, 'Обмен лент на билет', requestId);
      await grant(c, player.id, 'ribbon_exchange', requestId, { tickets }, 'Обмен лент на билет');
    }
    return { balances: await balances(c, player.id) };
  });
}
