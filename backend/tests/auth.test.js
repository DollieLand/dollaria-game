import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.DATABASE_URL ||= 'postgresql://unused';
const { verifyInitData } = await import('../src/middleware/auth.js');

function sign(fields, token) {
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

const TOKEN = '123456:TEST-TOKEN';
const user = JSON.stringify({ id: 42, first_name: 'Аня' });

test('правильная подпись Telegram принимается', () => {
  const data = sign({ auth_date: String(Math.floor(Date.now() / 1000)), query_id: 'q1', user }, TOKEN);
  assert.equal(verifyInitData(data, TOKEN, 3600).id, 42);
});

test('подделанные данные отклоняются', () => {
  const data = sign({ auth_date: String(Math.floor(Date.now() / 1000)), user }, TOKEN).replace('42', '43');
  assert.equal(verifyInitData(data, TOKEN, 3600), null);
});

test('чужой токен отклоняется', () => {
  const data = sign({ auth_date: String(Math.floor(Date.now() / 1000)), user }, 'other:token');
  assert.equal(verifyInitData(data, TOKEN, 3600), null);
});

test('устаревшая подпись отклоняется', () => {
  const data = sign({ auth_date: String(Math.floor(Date.now() / 1000) - 7200), user }, TOKEN);
  assert.equal(verifyInitData(data, TOKEN, 3600), null);
});
