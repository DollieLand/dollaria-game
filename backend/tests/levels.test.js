import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel } from '../src/game/levelGenerator.js';
import { WORD_SET } from '../src/data/dictionary.js';

test('первые 300 уровней генерируются, все слова есть в словаре и собираются из букв круга', () => {
  for (let n = 1; n <= 300; n++) {
    const l = generateLevel(n);
    assert.ok(l.words.length >= 3, `уровень ${n}: мало слов`);
    const pool = l.letters.join('');
    for (const w of [...l.words.map((x) => x.word), ...l.extras]) {
      assert.ok(WORD_SET.has(w), `уровень ${n}: «${w}» нет в словаре`);
      const left = [...pool];
      for (const ch of w) {
        const i = left.indexOf(ch);
        assert.ok(i >= 0, `уровень ${n}: «${w}» нельзя собрать из ${pool}`);
        left.splice(i, 1);
      }
    }
  }
});

test('уровень всегда одинаковый для всех игроков', () => {
  assert.deepEqual(generateLevel(57), generateLevel(57));
});

test('буквы в клетках пересечений совпадают', () => {
  for (let n = 1; n <= 200; n++) {
    const l = generateLevel(n);
    const grid = new Map();
    for (const w of l.words) {
      for (let i = 0; i < w.word.length; i++) {
        const k = `${w.row + (w.dir === 'v' ? i : 0)},${w.col + (w.dir === 'h' ? i : 0)}`;
        if (grid.has(k)) assert.equal(grid.get(k), w.word[i], `уровень ${n}`);
        grid.set(k, w.word[i]);
      }
    }
  }
});
