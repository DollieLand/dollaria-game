import { GameError } from '../utils/errors.js';

// Простой ограничитель частоты запросов в памяти сервера (на одного игрока или IP).
// Защищает от «залипших» кнопок и скриптов, которые шлют сотни запросов.
export function rateLimit({ windowMs = 10_000, max = 40 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const t = Date.now();
    for (const [k, v] of hits) if (v.reset < t) hits.delete(k);
  }, windowMs).unref();

  return (req, _res, next) => {
    const key = req.player ? `p${req.player.id}` : `ip${req.ip}`;
    const t = Date.now();
    let h = hits.get(key);
    if (!h || h.reset < t) { h = { count: 0, reset: t + windowMs }; hits.set(key, h); }
    h.count++;
    if (h.count > max) return next(new GameError('Слишком много действий подряд. Подождите пару секунд.', 429, 'rate_limited'));
    next();
  };
}
