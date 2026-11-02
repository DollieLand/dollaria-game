import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name}. Посмотрите .env.example`);
  return v;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  databaseSsl: process.env.DATABASE_SSL ? process.env.DATABASE_SSL === 'true' : isProduction,
  botToken: process.env.BOT_TOKEN || '',
  webAppUrl: process.env.WEBAPP_URL || '',
  frontendOrigins: (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean),
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  timezone: process.env.GAME_TIMEZONE || 'Europe/Moscow',
  contestEnd: process.env.CONTEST_END || '2026-12-31T23:59:59+03:00',
  initDataMaxAgeSec: Number(process.env.INIT_DATA_MAX_AGE_SEC) || 86400,
  // Режим разработки без Telegram. В продакшене всегда выключен.
  devAuth: !isProduction && process.env.DEV_AUTH === 'true',
  // Подмена «сегодняшней» даты для проверки календаря. В продакшене игнорируется.
  dateOverride: !isProduction ? process.env.GAME_DATE_OVERRIDE || '' : '',
};

if (isProduction && !config.botToken) {
  throw new Error('В продакшене обязательно нужен BOT_TOKEN — без него нельзя проверить игроков Telegram.');
}
