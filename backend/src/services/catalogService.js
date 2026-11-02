import { tx, query } from '../database/db.js';
import { COLLECTIONS, DOLLS, CATEGORIES } from '../data/dolls.js';
import { MISSIONS } from '../data/missions.js';

// При каждом запуске сервера переносим каталог из файлов data/*.js в базу данных.
export async function syncCatalog() {
  await tx(async (c) => {
    for (const col of COLLECTIONS) {
      await c.query(
        `INSERT INTO collections (id, title, starts_on, ends_on, set_bonus, in_gacha, sort) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET title=$2, starts_on=$3, ends_on=$4, set_bonus=$5, in_gacha=$6, sort=$7`,
        [col.id, col.title, col.startsOn, col.endsOn, col.setBonus, col.inGacha, col.sort],
      );
    }
    const ids = [];
    for (const d of DOLLS) {
      const cat = CATEGORIES[d.category];
      if (!cat) throw new Error(`Неизвестная категория куклы ${d.id}: ${d.category}`);
      ids.push(d.id);
      await c.query(
        `INSERT INTO dolls (id, collection_id, name, description, category, points, weight, duplicate_ribbons, sort, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
         ON CONFLICT (id) DO UPDATE SET collection_id=$2, name=$3, description=$4, category=$5, points=$6, weight=$7,
           duplicate_ribbons=$8, sort=$9, active=true`,
        [d.id, d.collectionId, d.name, d.description, d.category, cat.points, d.weight, cat.duplicateRibbons, d.sort],
      );
    }
    // Куклы, удалённые из файла, не стираются (они могут быть у игроков), а просто выключаются
    await c.query('UPDATE dolls SET active = false WHERE NOT (id = ANY($1))', [ids]);
    for (const m of MISSIONS) {
      await c.query(
        `INSERT INTO missions (id, period, title, event, goal, reward) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET period=$2, title=$3, event=$4, goal=$5, reward=$6`,
        [m.id, m.period, m.title, m.event, m.goal, m.reward],
      );
    }
  });
}

export async function allDolls() {
  const { rows } = await query(
    `SELECT d.*, c.title AS collection_title, c.sort AS collection_sort FROM dolls d
     JOIN collections c ON c.id = d.collection_id WHERE d.active ORDER BY c.sort, d.sort`,
  );
  return rows;
}

export function categoryTitle(cat) {
  return CATEGORIES[cat]?.title || cat;
}
