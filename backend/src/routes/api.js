import { Router } from 'express';
import { requireTelegramUser } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncRoute as a } from '../utils/errors.js';
import * as g from '../controllers/gameController.js';

export const api = Router();

api.use(requireTelegramUser);
api.use(rateLimit({ windowMs: 10_000, max: 60 }));

api.get('/me', a(g.me));
api.get('/level', a(g.getLevel));
api.post('/level/word', a(g.postWord));
api.post('/level/hint', a(g.postHint));
api.get('/gacha', a(g.getGacha));
api.post('/gacha/open', a(g.postGachaOpen));
api.get('/gacha/history', a(g.getGachaHistory));
api.post('/gacha/exchange', a(g.postExchange));
api.get('/collection', a(g.getCollection));
api.get('/calendar', a(g.getCalendar));
api.post('/calendar/claim', a(g.postCalendarClaim));
api.get('/missions', a(g.getMissions));
api.post('/missions/claim', a(g.postMissionClaim));
api.get('/leaderboard', a(g.getLeaderboard));
api.get('/profile', a(g.getProfile));
