import { config } from '../config.js';

export async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
  return data.result;
}

function playButton() {
  return { inline_keyboard: [[{ text: '❄️ Играть', web_app: { url: config.webAppUrl } }]] };
}

// Обработка сообщений боту (через webhook)
export async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.chat) return;
  const text = (msg.text || '').trim();
  if (text.startsWith('/start') || text.startsWith('/play')) {
    await tg('sendMessage', {
      chat_id: msg.chat.id,
      text:
        'Добро пожаловать в DOLLARIA — Winter Wonderland!\n\n' +
        'Разгадывайте слова, получайте подарочные билеты, открывайте подарки и собирайте коллекцию кукол. ' +
        'Самая ценная коллекция к 31 декабря получит главный приз.\n\nНажмите «Играть», чтобы начать.',
      reply_markup: playButton(),
    });
  } else if (text.startsWith('/help')) {
    await tg('sendMessage', {
      chat_id: msg.chat.id,
      text: 'Игра открывается кнопкой «Играть». Все награды бесплатные, покупок в игре нет.',
      reply_markup: playButton(),
    });
  }
}
