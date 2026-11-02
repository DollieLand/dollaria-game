import { h } from '../utils/dom.js';

// Сетка кроссворда. Показывает только известные буквы — ответы хранятся на сервере.
export function renderGrid(level, cellSize) {
  const known = new Map(level.cells.map((c) => [`${c.r},${c.c}`, c.ch]));
  const owners = new Map(); // клетка → id слов
  for (const w of level.words) {
    for (let i = 0; i < w.length; i++) {
      const k = `${w.row + (w.dir === 'v' ? i : 0)},${w.col + (w.dir === 'h' ? i : 0)}`;
      if (!owners.has(k)) owners.set(k, []);
      owners.get(k).push(w.id);
    }
  }
  const grid = h('div', {
    class: 'xword',
    style: { gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`, gridTemplateRows: `repeat(${level.rows}, ${cellSize}px)` },
    role: 'img',
    'aria-label': `Кроссворд: найдено ${level.words.filter((w) => w.found).length} из ${level.words.length} слов`,
  });
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const k = `${r},${c}`;
      if (!owners.has(k)) { grid.append(h('span', { class: 'xword__void' })); continue; }
      const ch = known.get(k);
      grid.append(h('span', {
        class: `xword__cell ${ch ? 'is-open' : ''}`,
        'data-cell': k,
        'data-words': owners.get(k).join(' '),
        style: { fontSize: `${Math.round(cellSize * 0.56)}px` },
      }, ch ? ch.toUpperCase() : ''));
    }
  }
  return grid;
}

export function flashWord(gridEl, wordId) {
  gridEl.querySelectorAll('.xword__cell').forEach((cell) => {
    if (cell.dataset.words.split(' ').includes(String(wordId))) {
      cell.classList.remove('is-pop');
      void cell.offsetWidth;
      cell.classList.add('is-pop');
    }
  });
}
