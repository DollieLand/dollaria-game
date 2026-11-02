-- Игроки (авторизация только через Telegram)
CREATE TABLE players (
  id            BIGSERIAL PRIMARY KEY,
  telegram_id   BIGINT NOT NULL UNIQUE,
  username      TEXT,
  first_name    TEXT,
  last_name     TEXT,
  photo_url     TEXT,
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Балансы валют. CHECK не даёт уйти в минус даже при ошибке в коде.
CREATE TABLE player_balances (
  player_id  BIGINT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  snowflakes INTEGER NOT NULL DEFAULT 0 CHECK (snowflakes >= 0),
  tickets    INTEGER NOT NULL DEFAULT 0 CHECK (tickets >= 0),
  ribbons    INTEGER NOT NULL DEFAULT 0 CHECK (ribbons >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Журнал всех начислений и списаний. UNIQUE защищает от повторной выдачи одной и той же награды.
CREATE TABLE reward_ledger (
  id          BIGSERIAL PRIMARY KEY,
  player_id   BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  source_ref  TEXT NOT NULL,
  snowflakes  INTEGER NOT NULL DEFAULT 0,
  tickets     INTEGER NOT NULL DEFAULT 0,
  ribbons     INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, source, source_ref)
);
CREATE INDEX reward_ledger_player_idx ON reward_ledger(player_id, created_at DESC);

-- Сгенерированные уровни (кэш генератора)
CREATE TABLE levels (
  level_number INTEGER PRIMARY KEY,
  chapter      INTEGER NOT NULL,
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Прогресс игрока на уровне
CREATE TABLE level_progress (
  player_id     BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_number  INTEGER NOT NULL,
  found_words   TEXT[] NOT NULL DEFAULT '{}',
  extra_words   TEXT[] NOT NULL DEFAULT '{}',
  revealed      TEXT[] NOT NULL DEFAULT '{}',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  PRIMARY KEY (player_id, level_number)
);

-- Коллекции (наборы) и куклы
CREATE TABLE collections (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  starts_on  DATE,
  ends_on    DATE,
  set_bonus  INTEGER NOT NULL DEFAULT 0,
  in_gacha   BOOLEAN NOT NULL DEFAULT true,
  sort       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE dolls (
  id            TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL,
  points        INTEGER NOT NULL CHECK (points >= 0),
  weight        INTEGER NOT NULL DEFAULT 0 CHECK (weight >= 0),
  duplicate_ribbons INTEGER NOT NULL DEFAULT 0,
  sort          INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true
);

-- Полученные игроком куклы. Одна строка на куклу — дубликаты лишь увеличивают copies.
CREATE TABLE player_dolls (
  player_id          BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  doll_id            TEXT NOT NULL REFERENCES dolls(id),
  copies             INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 1),
  first_obtained_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_obtained_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, doll_id)
);

-- История открытия подарков. request_id защищает от двойного списания при повторном запросе.
CREATE TABLE gacha_history (
  id               BIGSERIAL PRIMARY KEY,
  player_id        BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id       UUID NOT NULL,
  collection_id    TEXT NOT NULL,
  doll_id          TEXT NOT NULL REFERENCES dolls(id),
  was_duplicate    BOOLEAN NOT NULL,
  ribbons_awarded  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, request_id)
);

-- Задания (описания хранятся в коде и синхронизируются при запуске) и полученные награды за них
CREATE TABLE missions (
  id      TEXT PRIMARY KEY,
  period  TEXT NOT NULL,
  title   TEXT NOT NULL,
  event   TEXT NOT NULL,
  goal    INTEGER NOT NULL,
  reward  JSONB NOT NULL
);

CREATE TABLE mission_claims (
  player_id  BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  period_key TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, mission_id, period_key)
);

-- Игровые события: из них считается прогресс заданий и статистика
CREATE TABLE game_events (
  id         BIGSERIAL PRIMARY KEY,
  player_id  BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  ref        TEXT,
  day_key    TEXT NOT NULL,
  week_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX game_events_lookup ON game_events(player_id, type, day_key);
CREATE INDEX game_events_week ON game_events(player_id, type, week_key);
CREATE UNIQUE INDEX game_events_once ON game_events(player_id, type, ref) WHERE ref IS NOT NULL;

-- Новогодний календарь
CREATE TABLE calendar_claims (
  player_id  BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  day        INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
  reward     JSONB NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, day)
);
