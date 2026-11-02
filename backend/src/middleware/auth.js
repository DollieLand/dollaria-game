import crypto from 'node:crypto';
import { config } from '../config.js';
import { GameError } from '../utils/errors.js';
import { ensurePlayer } from '../services/playerService.js';

// Проверка подписи Telegram initData по официальному алгоритму:
// secret = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN), hash = HMAC_SHA256(key=secret, data=data_check_string)
export function verifyInitData(initData, botToken, maxAgeSec) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;

  let user;
  try { user = JSON.parse(params.get('user') || 'null'); } catch { return null; }
  if (!user || !Number.isInteger(user.id)) return null;
  return user;
}

export async function requireTelegramUser(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    let tgUser = null;

    if (header.startsWith('tma ') && config.botToken) {
      tgUser = verifyInitData(header.slice(4), config.botToken, config.initDataMaxAgeSec);
    } else if (config.devAuth && req.get('x-dev-user')) {
      // Только для разработки на компьютере (DEV_AUTH=true и NODE_ENV не production)
      const id = Number(req.get('x-dev-user'));
      if (Number.isInteger(id) && id > 0) tgUser = { id, first_name: 'Тестовый игрок', username: `dev${id}` };
    }

    if (!tgUser) throw new GameError('Откройте игру через Telegram-бота', 401, 'unauthorized');
    req.player = await ensurePlayer(tgUser);
    next();
  } catch (e) {
    next(e);
  }
}
