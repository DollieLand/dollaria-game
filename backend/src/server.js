import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { pool } from './database/db.js';
import { runMigrations } from './database/migrate.js';
import { syncCatalog } from './services/catalogService.js';
import { api } from './routes/api.js';
import { telegram } from './routes/telegram.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

// Запросы разрешены только с адреса игры (FRONTEND_URL)
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (!config.isProduction && config.frontendOrigins.length === 0) return cb(null, true);
    cb(null, config.frontendOrigins.includes(origin));
  },
  allowedHeaders: ['content-type', 'authorization', 'x-dev-user'],
  methods: ['GET', 'POST'],
}));

app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/', (_req, res) => res.json({ name: 'DOLLARIA API', health: '/health' }));
app.use('/api', api);
app.use('/telegram', telegram);
app.use((_req, res) => res.status(404).json({ error: 'Адрес не найден', code: 'not_found' }));
app.use(errorHandler);

async function start() {
  await runMigrations();
  await syncCatalog();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`DOLLARIA API запущен на порту ${config.port}`);
    if (config.devAuth) console.log('ВНИМАНИЕ: включён режим разработки DEV_AUTH (вход без Telegram)');
  });
}

start().catch((e) => {
  console.error('Сервер не запустился:', e);
  process.exit(1);
});
