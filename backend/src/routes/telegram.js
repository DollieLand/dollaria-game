import { Router } from 'express';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { handleUpdate } from '../telegram/bot.js';

export const telegram = Router();

// Telegram присылает сюда сообщения боту. Секрет в заголовке подтверждает, что запрос от Telegram.
telegram.post('/webhook', async (req, res) => {
  const got = Buffer.from(req.get('x-telegram-bot-api-secret-token') || '');
  const want = Buffer.from(config.webhookSecret);
  if (!config.webhookSecret || got.length !== want.length || !crypto.timingSafeEqual(got, want)) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);
  handleUpdate(req.body).catch((e) => console.error('Ошибка обработки сообщения бота:', e.message));
});
