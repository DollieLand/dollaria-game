import { GameError } from '../utils/errors.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof GameError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Неверный формат запроса', code: 'bad_json' });
  }
  console.error(err);
  res.status(500).json({ error: 'Что-то пошло не так на сервере. Попробуйте ещё раз.', code: 'server_error' });
}
