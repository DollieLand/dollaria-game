import { GameError } from './errors.js';

export function int(value, { min = -Infinity, max = Infinity, name = 'value' } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new GameError(`Неверное значение: ${name}`);
  return n;
}

export function oneOf(value, list, name = 'value') {
  if (!list.includes(value)) throw new GameError(`Неверное значение: ${name}`);
  return value;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuid(value, name = 'requestId') {
  if (typeof value !== 'string' || !UUID.test(value)) throw new GameError(`Неверное значение: ${name}`);
  return value.toLowerCase();
}

export function word(value) {
  if (typeof value !== 'string') throw new GameError('Слово не передано');
  const w = value.trim().toLowerCase().replace(/ё/g, 'е');
  if (!/^[а-я]{2,12}$/.test(w)) throw new GameError('Слово должно состоять из русских букв');
  return w;
}
