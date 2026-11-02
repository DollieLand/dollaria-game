// Настройка бота одной командой: npm run setup-bot
// Нужны переменные BOT_TOKEN, WEBAPP_URL (адрес игры), BACKEND_URL (адрес сервера) и TELEGRAM_WEBHOOK_SECRET.
import 'dotenv/config';

const { BOT_TOKEN, WEBAPP_URL, BACKEND_URL, TELEGRAM_WEBHOOK_SECRET } = process.env;
for (const [k, v] of Object.entries({ BOT_TOKEN, WEBAPP_URL, BACKEND_URL, TELEGRAM_WEBHOOK_SECRET })) {
  if (!v) { console.error(`Не задана переменная ${k}`); process.exit(1); }
}

async function call(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json();
  console.log(`${method}: ${d.ok ? 'готово' : 'ошибка — ' + d.description}`);
  return d;
}

await call('setWebhook', {
  url: `${BACKEND_URL.replace(/\/$/, '')}/telegram/webhook`,
  secret_token: TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ['message'],
});
await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: WEBAPP_URL } } });
await call('setMyCommands', { commands: [{ command: 'start', description: 'Начать игру' }, { command: 'help', description: 'Помощь' }] });
await call('setMyShortDescription', { short_description: 'Новогодняя игра: слова, подарки и коллекция кукол' });
