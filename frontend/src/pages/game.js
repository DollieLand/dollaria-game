import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { setBalances, state, setMe } from '../state.js';
import { haptic } from '../telegram.js';
import { icon } from '../components/icons.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { inlineCost, rewardTiles, currencyButton } from '../components/currency.js';
import { Wheel } from '../game/wheel.js';
import { renderGrid, flashWord } from '../game/grid.js';
import { play } from '../utils/sound.js';
import { plural } from '../utils/format.js';

export async function gamePage(view, { go }) {
  view.classList.add('view--game');
  view.append(h('div', { class: 'spinner', 'aria-label': 'Загрузка уровня' }));
  let level = await api.level();
  let queue = Promise.resolve();
  let wheel = null;
  let gridEl = null;
  let previewEl = null;
  let disposed = false;

  const sizes = () => {
    const w = Math.min(view.clientWidth, 520);
    const hgt = view.clientHeight;
    const wheelSize = Math.max(200, Math.min(270, Math.floor(w * 0.64), Math.floor(hgt * 0.36)));
    const availH = hgt - wheelSize - 250;
    const cell = Math.max(24, Math.min(48, Math.floor((w - 56) / level.cols) - 4, Math.floor(availH / level.rows) - 4));
    return { wheelSize, cell };
  };

  function draw() {
    if (disposed) return;
    const { wheelSize, cell } = sizes();
    gridEl = renderGrid(level, cell);
    previewEl = h('div', { class: 'preview', 'aria-live': 'polite' });
    wheel = new Wheel({
      letters: level.letters,
      size: wheelSize,
      onPreview: (t) => {
        previewEl.textContent = t.toUpperCase();
        previewEl.classList.toggle('is-empty', !t);
      },
      onWord: (word) => { queue = queue.then(() => submit(word)); },
    });
    previewEl.classList.add('is-empty');

    const found = level.words.filter((w) => w.found).length;
    const header = h('header', { class: 'game-head' },
      h('button', { class: 'btn btn--icon', 'aria-label': 'Вернуться в городок', onClick: () => go(''), html: icon('back') }),
      h('div', { class: 'game-head__title' },
        h('h1', {}, `Уровень ${level.level}`),
        h('span', {}, `Глава ${level.chapter} · ${level.chapterTitle}`),
      ),
      currencyButton('snowflakes', state.me?.balances?.snowflakes ?? 0),
    );

    const board = h('section', { class: 'board panel panel--garland', 'aria-label': 'Поле кроссворда' },
      h('div', { class: 'board__info' },
        h('span', {}, `Слова: ${found} / ${level.words.length}`),
        h('button', { class: 'link', onClick: showExtras }, `Доп. слова: ${level.extrasFound.length}`),
      ),
      gridEl,
    );

    const controls = h('div', { class: 'wheel-zone' },
      h('div', { class: 'wheel-side' },
        h('button', { class: 'btn btn--icon tool', 'aria-label': 'Перемешать буквы', onClick: () => { wheel.shuffle(); haptic('light'); }, html: icon('shuffle') }),
        h('button', { class: 'btn btn--icon tool', 'aria-label': 'Дополнительные слова', onClick: showExtras, html: icon('book') }),
      ),
      wheel.el,
      h('div', { class: 'wheel-side' },
        h('button', { class: 'btn tool tool--hint', 'aria-label': `Открыть букву за ${level.prices.hintLetter} снежинок`, onClick: () => hint('letter') },
          h('span', { html: icon('bulb'), style: { display: 'contents' } }), inlineCost('snowflakes', level.prices.hintLetter)),
        h('button', { class: 'btn tool tool--hint', 'aria-label': `Открыть слово за ${level.prices.hintWord} снежинок`, onClick: () => hint('word') },
          h('span', { html: icon('word'), style: { display: 'contents' } }), inlineCost('snowflakes', level.prices.hintWord)),
      ),
    );

    clear(view).append(h('div', { class: 'game' }, header, board, previewEl, controls));
  }

  async function submit(word) {
    try {
      const res = await api.word(level.level, word);
      level = res.state;
      setBalances(res.balances);
      if (res.result === 'found') {
        haptic('success'); play('word');
        draw(); flashWord(gridEl, res.wordId);
      } else if (res.result === 'extra') {
        haptic('light');
        toast(res.reward ? `Дополнительное слово! +${res.reward.snowflakes} снежинки` : 'Дополнительное слово', 'good');
        draw();
      } else if (res.result === 'already') {
        toast('Это слово уже найдено');
      } else {
        haptic('error');
        previewEl.textContent = word.toUpperCase();
        previewEl.classList.remove('is-empty');
        previewEl.classList.add('is-wrong');
        setTimeout(() => { previewEl.classList.remove('is-wrong'); previewEl.textContent = ''; previewEl.classList.add('is-empty'); }, 600);
      }
      if (res.completion) victory(res.completion);
    } catch (e) {
      toast(e.message);
      if (e.code === 'wrong_level' || e.code === 'completed') await reload();
    }
  }

  async function hint(kind) {
    try {
      const res = await api.hint(level.level, kind);
      level = res.state;
      setBalances(res.balances);
      haptic('medium');
      draw();
      if (res.completion) victory(res.completion);
    } catch (e) {
      haptic('error');
      toast(e.message);
    }
  }

  function showExtras() {
    const list = level.extrasFound;
    openModal([
      h('h2', {}, 'Дополнительные слова'),
      h('p', { style: { textAlign: 'center' } },
        `Найдено ${list.length} из ${level.extrasTotal}. За каждое — снежинки, даже если основные слова уже отгаданы.`),
      list.length
        ? h('div', { class: 'extras' }, list.map((w) => h('span', { class: 'extras__word' }, w.toUpperCase())))
        : h('p', { class: 'empty' }, level.extrasTotal ? 'Составляйте из букв другие слова — они появятся здесь.' : 'На этом уровне дополнительных слов нет.'),
    ]);
  }

  function victory(c) {
    haptic('success'); play('win');
    const close = openModal([
      h('img', { src: '/assets/images/giftbox.png', alt: '', class: 'victory__gift' }),
      h('p', { class: 'victory__kicker' }, 'Поздравляем!'),
      h('h2', {}, `Уровень ${c.level} пройден`),
      h('div', { class: 'victory__stats' },
        h('div', {}, h('b', {}, String(c.wordsFound)), h('span', {}, plural(c.wordsFound, 'слово', 'слова', 'слов'))),
        h('div', {}, h('b', {}, String(c.extrasFound)), h('span', {}, 'доп. слов')),
      ),
      rewardTiles(c.reward),
      h('div', { class: 'modal__actions' },
        h('button', { class: 'btn btn--primary btn--big btn--wide', onClick: async () => { close(); await reload(); } }, 'Следующий уровень'),
        h('button', { class: 'link', onClick: () => { close(); go(''); } }, 'Вернуться в городок'),
      ),
    ], { closable: false });
    api.me().then(setMe).catch(() => {});
  }

  async function reload() {
    level = await api.level();
    draw();
  }

  const onResize = () => draw();
  window.addEventListener('resize', onResize);
  draw();
  return () => { disposed = true; window.removeEventListener('resize', onResize); };
}
