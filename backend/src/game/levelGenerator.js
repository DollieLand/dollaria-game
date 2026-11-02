// Генератор уровней словесной игры.
// Уровень с номером N всегда получается одинаковым (детерминированный генератор),
// поэтому уровни бесконечны, но у всех игроков уровень N совпадает — соревнование честное.

import { WORDS } from '../data/dictionary.js';

const CHAPTERS = [
  'Розовое Рождество',
  'Конфетная улица',
  'Зимние принцессы',
  'Праздничный бал',
  'Королевы Нового года',
  'Снежная сказка',
];
export const LEVELS_PER_CHAPTER = 20;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function letterCounts(word) {
  const m = new Map();
  for (const ch of word) m.set(ch, (m.get(ch) || 0) + 1);
  return m;
}

function canForm(word, baseCounts) {
  const need = letterCounts(word);
  for (const [ch, n] of need) if ((baseCounts.get(ch) || 0) < n) return false;
  return true;
}

// Параметры сложности для номера уровня
export function difficulty(level) {
  if (level <= 5) return { baseLen: [4], minWords: 3, maxWords: 3, maxSize: 6 };
  if (level <= 15) return { baseLen: [4, 5], minWords: 3, maxWords: 4, maxSize: 7 };
  if (level <= 35) return { baseLen: [5], minWords: 4, maxWords: 5, maxSize: 7 };
  if (level <= 70) return { baseLen: [5, 6], minWords: 4, maxWords: 6, maxSize: 8 };
  if (level <= 150) return { baseLen: [6], minWords: 5, maxWords: 7, maxSize: 9 };
  return { baseLen: [6, 7], minWords: 5, maxWords: 8, maxSize: 9 };
}

// ---------- раскладка кроссворда ----------
function key(r, c) {
  return r + ',' + c;
}

function tryPlace(grid, word, row, col, dir) {
  // dir: 'h' или 'v'. Возвращает количество пересечений или -1, если поставить нельзя.
  const dr = dir === 'v' ? 1 : 0;
  const dc = dir === 'h' ? 1 : 0;
  // клетки до и после слова должны быть пустыми
  if (grid.has(key(row - dr, col - dc))) return -1;
  if (grid.has(key(row + dr * word.length, col + dc * word.length))) return -1;
  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid.get(key(r, c));
    if (cell) {
      if (cell.ch !== word[i]) return -1;
      if (cell.dirs.has(dir)) return -1; // слова не должны лежать друг на друге
      crossings++;
    } else {
      // соседние клетки сбоку должны быть пустыми, чтобы не образовывались лишние слова
      if (grid.has(key(r + dc, c + dr))) return -1;
      if (grid.has(key(r - dc, c - dr))) return -1;
    }
  }
  return crossings;
}

function put(grid, word, row, col, dir) {
  const dr = dir === 'v' ? 1 : 0;
  const dc = dir === 'h' ? 1 : 0;
  for (let i = 0; i < word.length; i++) {
    const k = key(row + dr * i, col + dc * i);
    const cell = grid.get(k) || { ch: word[i], dirs: new Set() };
    cell.dirs.add(dir);
    grid.set(k, cell);
  }
}

function bounds(grid) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const k of grid.keys()) {
    const [r, c] = k.split(',').map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  return { minR, maxR, minC, maxC };
}

function layout(words, maxSize, maxWords) {
  const grid = new Map();
  const placed = [];
  const [first, ...rest] = words;
  put(grid, first, 0, 0, 'h');
  placed.push({ word: first, row: 0, col: 0, dir: 'h' });

  for (const word of rest) {
    if (placed.length >= maxWords) break;
    let best = null;
    for (const p of placed) {
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (p.word[i] !== word[j]) continue;
          const dir = p.dir === 'h' ? 'v' : 'h';
          const row = p.dir === 'h' ? p.row - j : p.row + i;
          const col = p.dir === 'h' ? p.col + i : p.col - j;
          const crossings = tryPlace(grid, word, row, col, dir);
          if (crossings < 1) continue;
          // проверяем размер поля после установки
          const test = new Map(grid);
          put(test, word, row, col, dir);
          const b = bounds(test);
          const h = b.maxR - b.minR + 1;
          const w = b.maxC - b.minC + 1;
          if (h > maxSize || w > maxSize) continue;
          const score = crossings * 100 - (h * w) - Math.abs(h - w) * 3;
          if (!best || score > best.score) best = { row, col, dir, score };
        }
      }
    }
    if (best) {
      put(grid, word, best.row, best.col, best.dir);
      placed.push({ word, row: best.row, col: best.col, dir: best.dir });
    }
  }

  const b = bounds(grid);
  return {
    rows: b.maxR - b.minR + 1,
    cols: b.maxC - b.minC + 1,
    words: placed.map((p) => ({ word: p.word, row: p.row - b.minR, col: p.col - b.minC, dir: p.dir })),
  };
}

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SALT = 0x5eed2026;

export function generateLevel(level) {
  const d = difficulty(level);
  const rnd = mulberry32((level * 2654435761) ^ SALT);
  const candidates = shuffle(WORDS.filter((w) => d.baseLen.includes(w.length)), rnd);

  for (const base of candidates) {
    const counts = letterCounts(base);
    const formable = WORDS.filter((w) => w.length >= 3 && w.length <= base.length && canForm(w, counts));
    if (formable.length < d.minWords) continue;

    // базовое слово первым, затем длинные слова — их проще пересекать
    const ordered = [base, ...shuffle(formable.filter((w) => w !== base), rnd).sort((a, b) => b.length - a.length)];
    const result = layout(ordered, d.maxSize, d.maxWords);
    if (result.words.length < d.minWords) continue;

    const mainSet = new Set(result.words.map((w) => w.word));
    const extras = formable.filter((w) => !mainSet.has(w)).sort();

    // буквы для круга: перемешиваем, но не оставляем исходное слово целиком
    let letters = shuffle([...base], rnd);
    if (letters.join('') === base) letters = letters.reverse();

    const chapterIndex = Math.floor((level - 1) / LEVELS_PER_CHAPTER);
    return {
      level,
      chapter: chapterIndex + 1,
      chapterTitle: CHAPTERS[chapterIndex % CHAPTERS.length],
      letters,
      rows: result.rows,
      cols: result.cols,
      words: result.words.map((w, i) => ({ id: i, ...w })),
      extras,
    };
  }
  // Запасной вариант: если словарь слишком мал для этого уровня — берём параметры попроще.
  if (level > 1) return { ...generateLevel(((level - 1) % 35) + 1), level };
  throw new Error('Словарь слишком мал для генерации уровней');
}
