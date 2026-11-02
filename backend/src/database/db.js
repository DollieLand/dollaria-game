import pg from 'pg';
import { config } from '../config.js';

// Большие числа (bigint) приходят строками — превращаем их в обычные числа там, где это безопасно.
pg.types.setTypeParser(20, (v) => Number(v));

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

export function query(text, params) {
  return pool.query(text, params);
}

// Выполняет функцию внутри транзакции: либо всё сохраняется, либо ничего.
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
