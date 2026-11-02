import crypto from 'node:crypto';
import { query, tx } from '../database/db.js';
import { generateLevel } from '../game/levelGenerator.js';
import { ECONOMY } from '../data/economy.js';
import { GameError } from '../utils/errors.js';
import { grant, spend, balances } from './rewardService.js';
import { record } from './eventService.js';

const cache = new Map();

// Уровень берётся из базы; если его там ещё нет — генерируется и сохраняется.
export async function getLevel(n) {
  if (cache.has(n)) return cache.get(n);
  const { rows } = await query('SELECT data FROM levels WHERE level_number = $1', [n]);
  let data = rows[0]?.data;
  if (!data) {
    data = generateLevel(n);
    await query('INSERT INTO levels (level_number, chapter, data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [n, data.chapter, data]);
  }
  if (cache.size > 500) cache.clear();
  cache.set(n, data);
  return data;
}

function cellsOf(w) {
  return Array.from({ length: w.word.length }, (_, i) => ({
    r: w.row + (w.dir === 'v' ? i : 0),
    c: w.col + (w.dir === 'h' ? i : 0),
    ch: w.word[i],
  }));
}

async function loadProgress(c, playerId, level, lock = false) {
  await c.query(
    'INSERT INTO level_progress (player_id, level_number) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [playerId, level],
  );
  const { rows } = await c.query(
    `SELECT * FROM level_progress WHERE player_id = $1 AND level_number = $2 ${lock ? 'FOR UPDATE' : ''}`,
    [playerId, level],
  );
  return rows[0];
}

// То, что видит игрок: форма сетки и только уже открытые буквы. Ответы не отправляются в браузер.
export function publicView(data, progress) {
  const found = new Set(progress.found_words);
  const revealed = new Set(progress.revealed);
  const known = new Map();
  for (const w of data.words) {
    for (const cell of cellsOf(w)) {
      const k = `${cell.r},${cell.c}`;
      if (found.has(w.word) || revealed.has(k)) known.set(k, cell.ch);
    }
  }
  return {
    level: data.level,
    chapter: data.chapter,
    chapterTitle: data.chapterTitle,
    letters: data.letters,
    rows: data.rows,
    cols: data.cols,
    words: data.words.map((w) => ({
      id: w.id, row: w.row, col: w.col, dir: w.dir, length: w.word.length,
      found: found.has(w.word),
    })),
    cells: [...known].map(([k, ch]) => { const [r, c] = k.split(',').map(Number); return { r, c, ch }; }),
    extrasFound: progress.extra_words,
    extrasTotal: data.extras.length,
    completed: !!progress.completed_at,
    prices: { hintLetter: ECONOMY.hintLetterCost, hintWord: ECONOMY.hintWordCost },
  };
}

export async function currentLevel(player) {
  const data = await getLevel(player.current_level);
  const progress = await tx((c) => loadProgress(c, player.id, player.current_level));
  return publicView(data, progress);
}

// Слова, у которых все клетки уже открыты подсказками, считаются найденными
function autoFound(data, progress) {
  const found = new Set(progress.found_words);
  const revealed = new Set(progress.revealed);
  for (const w of data.words) {
    if (found.has(w.word)) continue;
    if (cellsOf(w).every((cell) => revealed.has(`${cell.r},${cell.c}`))) found.add(w.word);
  }
  return [...found];
}

async function completeIfDone(c, player, data, progress) {
  if (progress.completed_at) return null;
  if (progress.found_words.length < data.words.length) return null;
  await c.query('UPDATE level_progress SET completed_at = now() WHERE player_id = $1 AND level_number = $2', [player.id, data.level]);
  const reward = { ...ECONOMY.levelComplete };
  if (data.level % ECONOMY.ticketEveryLevels === 0) reward.tickets = (reward.tickets || 0) + 1;
  await grant(c, player.id, 'level_complete', data.level, reward, `Уровень ${data.level}`);
  await record(c, player.id, 'level_complete', data.level);
  await c.query('UPDATE players SET current_level = $2 WHERE id = $1 AND current_level = $3', [player.id, data.level + 1, data.level]);
  return { level: data.level, nextLevel: data.level + 1, reward, wordsFound: data.words.length, extrasFound: progress.extra_words.length };
}

async function ensureCurrent(player, level) {
  if (level !== player.current_level) throw new GameError('Этот уровень уже пройден или ещё не открыт', 409, 'wrong_level');
}

export async function submitWord(player, level, word) {
  await ensureCurrent(player, level);
  const data = await getLevel(level);
  return tx(async (c) => {
    const progress = await loadProgress(c, player.id, level, true);
    if (progress.completed_at) throw new GameError('Уровень уже пройден', 409, 'completed');
    const main = data.words.find((w) => w.word === word);
    let result = 'wrong';
    let reward = null;

    if (main && !progress.found_words.includes(word)) {
      progress.found_words = [...progress.found_words, word];
      result = 'found';
    } else if (main || progress.extra_words.includes(word)) {
      result = 'already';
    } else if (data.extras.includes(word)) {
      progress.extra_words = [...progress.extra_words, word];
      result = 'extra';
      const ref = `${level}:${word}`;
      if (await grant(c, player.id, 'extra_word', ref, ECONOMY.extraWord, `Доп. слово «${word}»`)) reward = ECONOMY.extraWord;
      await record(c, player.id, 'extra_word', ref);
    }

    if (result === 'found' || result === 'extra') {
      await c.query(
        'UPDATE level_progress SET found_words = $3, extra_words = $4 WHERE player_id = $1 AND level_number = $2',
        [player.id, level, progress.found_words, progress.extra_words],
      );
    }
    const completion = await completeIfDone(c, player, data, progress);
    return {
      result,
      wordId: main ? main.id : null,
      reward,
      completion,
      state: publicView(data, progress),
      balances: await balances(c, player.id),
    };
  });
}

export async function useHint(player, level, kind) {
  await ensureCurrent(player, level);
  const data = await getLevel(level);
  return tx(async (c) => {
    const progress = await loadProgress(c, player.id, level, true);
    if (progress.completed_at) throw new GameError('Уровень уже пройден', 409, 'completed');
    const found = new Set(progress.found_words);
    const unfound = data.words.filter((w) => !found.has(w.word));
    if (!unfound.length) throw new GameError('Все слова уже найдены');

    if (kind === 'letter') {
      const revealed = new Set(progress.revealed);
      const foundCells = new Set(data.words.filter((w) => found.has(w.word)).flatMap((w) => cellsOf(w).map((x) => `${x.r},${x.c}`)));
      const options = [...new Set(unfound.flatMap((w) => cellsOf(w).map((x) => `${x.r},${x.c}`)))]
        .filter((k) => !revealed.has(k) && !foundCells.has(k));
      if (!options.length) throw new GameError('Открывать больше нечего');
      await spend(c, player.id, 'hint_letter', { snowflakes: ECONOMY.hintLetterCost }, `Подсказка: буква, уровень ${level}`);
      progress.revealed = [...progress.revealed, options[crypto.randomInt(options.length)]];
    } else {
      const target = unfound.slice().sort((a, b) => a.word.length - b.word.length)[0];
      await spend(c, player.id, 'hint_word', { snowflakes: ECONOMY.hintWordCost }, `Подсказка: слово, уровень ${level}`);
      progress.revealed = [...new Set([...progress.revealed, ...cellsOf(target).map((x) => `${x.r},${x.c}`)])];
    }
    progress.found_words = autoFound(data, progress);
    await c.query(
      'UPDATE level_progress SET revealed = $3, found_words = $4 WHERE player_id = $1 AND level_number = $2',
      [player.id, level, progress.revealed, progress.found_words],
    );
    const completion = await completeIfDone(c, player, data, progress);
    return { completion, state: publicView(data, progress), balances: await balances(c, player.id) };
  });
}
