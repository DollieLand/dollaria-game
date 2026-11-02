import { config } from '../config.js';
import { COLLECTIONS } from '../data/dolls.js';

// «Сейчас» с учётом подмены даты в режиме разработки
export function now() {
  if (config.dateOverride) {
    const d = new Date(config.dateOverride);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

// Дата в часовом поясе игры: { year, month, day, key: 'YYYY-MM-DD' }
export function gameDate(date = now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const key = `${get('year')}-${get('month')}-${get('day')}`;
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')), key };
}

// Коллекция недели, активная в указанный игровой день
export function activeCollection(dayKey = gameDate().key) {
  const list = COLLECTIONS.filter((c) => c.inGacha && c.startsOn);
  const found = list.find((c) => c.startsOn <= dayKey && dayKey <= c.endsOn);
  if (found) return found;
  // До начала сезона показываем первую коллекцию, после окончания — последнюю
  return dayKey < list[0].startsOn ? list[0] : list[list.length - 1];
}

// Ключ «недели» — совпадает со сменой коллекции, поэтому недельные задания обновляются вместе с гачей
export function weekKey(dayKey = gameDate().key) {
  const c = activeCollection(dayKey);
  if (c.startsOn <= dayKey && dayKey <= c.endsOn) return `col:${c.id}`;
  // вне расписания — обычная календарная неделя (понедельник)
  const d = new Date(dayKey + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return `wk:${d.toISOString().slice(0, 10)}`;
}

export function contestEnd() {
  return new Date(config.contestEnd);
}

export function isContestOver() {
  return now() > contestEnd();
}

// Сколько миллисекунд до начала следующего игрового дня (для таймера в заданиях)
export function msUntilNextGameDay() {
  const n = now();
  const today = gameDate(n).key;
  let lo = 0, hi = 26 * 3600 * 1000;
  // бинарный поиск момента смены даты — работает для любого часового пояса
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (gameDate(new Date(n.getTime() + mid)).key === today) lo = mid; else hi = mid;
  }
  return hi;
}
