export const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

export const num = (n) => new Intl.NumberFormat('ru-RU').format(n || 0);

export function dateRu(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function dateTimeRu(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function duration(ms) {
  if (ms <= 0) return '0 мин';
  const d = Math.floor(ms / 86400000);
  const hh = Math.floor((ms % 86400000) / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d} ${plural(d, 'день', 'дня', 'дней')} ${hh} ч`;
  if (hh > 0) return `${hh} ч ${mm} мин`;
  return `${mm} мин`;
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const x = [...b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
