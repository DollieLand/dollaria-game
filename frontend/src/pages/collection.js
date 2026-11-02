import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { openModal } from '../components/modal.js';
import { dollImage, categoryChip } from '../components/doll.js';
import { dateRu } from '../utils/format.js';

const SORTS = {
  set: { title: 'По наборам', fn: () => 0 },
  points: { title: 'По очкам', fn: (a, b) => b.points - a.points },
  date: { title: 'По дате', fn: (a, b) => new Date(b.obtainedAt || 0) - new Date(a.obtainedAt || 0) },
  name: { title: 'По имени', fn: (a, b) => (a.name || 'я').localeCompare(b.name || 'я', 'ru') },
};

export async function collectionPage(view) {
  view.append(h('div', { class: 'spinner' }));
  const data = await api.collection();
  let filter = 'all';
  let sort = 'set';
  let onlyMissing = false;

  function draw() {
    let dolls = data.dolls.filter((d) => filter === 'all' || d.collectionId === filter);
    if (onlyMissing) dolls = dolls.filter((d) => !d.owned);
    dolls = dolls.slice().sort((a, b) => (b.owned - a.owned) || SORTS[sort].fn(a, b));
    const col = data.collections.find((c) => c.id === filter);
    const s = data.stats;

    clear(view).append(h('div', { class: 'page collection' },
      h('h1', { class: 'page-title' }, 'Домик кукол'),
      h('div', { class: 'stats4' },
        stat(`${s.owned}/${s.total}`, 'кукол'),
        stat(s.points, 'очков'),
        stat(s.setsDone, 'наборов'),
        stat(data.collections.filter((c) => c.isSet).length, 'всего наборов'),
      ),
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Наборы' },
        tab('all', 'Все'),
        data.collections.map((c) => tab(c.id, c.title)),
      ),
      h('div', { class: 'collection__tools' },
        h('label', { class: 'select' }, h('span', { class: 'sr-only' }, 'Сортировка'),
          h('select', { onChange: (e) => { sort = e.target.value; draw(); } },
            Object.entries(SORTS).map(([k, v]) => h('option', { value: k, selected: k === sort }, v.title)))),
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: onlyMissing, onChange: (e) => { onlyMissing = e.target.checked; draw(); } }),
          'Только недостающие'),
      ),
      col ? setCard(col) : setsOverview(),
      dolls.length
        ? h('div', { class: 'doll-grid' }, dolls.map(card))
        : h('p', { class: 'empty' }, onlyMissing ? 'В этом наборе собраны все куклы!' : 'Здесь пока пусто.'),
    ));
  }

  const stat = (v, l) => h('div', { class: 'stat' }, h('b', {}, String(v)), h('span', {}, l));
  const tab = (id, title) => h('button', {
    class: `tab ${filter === id ? 'is-active' : ''}`, role: 'tab', 'aria-selected': String(filter === id),
    onClick: () => { filter = id; draw(); },
  }, title);

  function setCard(c) {
    if (!c.isSet) return h('div', { class: 'panel set-card' }, h('b', {}, c.title), h('p', {}, 'Особые куклы из календаря и событий.'));
    return h('div', { class: `panel set-card ${c.complete ? 'is-complete' : ''}` },
      h('div', { class: 'set-card__row' }, h('b', {}, c.title), h('span', {}, `${c.owned} / ${c.total}`)),
      h('div', { class: 'progress' }, h('span', { style: { width: `${(c.owned / c.total) * 100}%` } })),
      h('p', {}, c.complete ? `Набор собран — бонус +${c.setBonus} очков` : `Соберите все ${c.total} кукол и получите +${c.setBonus} очков`),
      c.complete ? h('span', { class: 'set-card__stamp' }, 'Набор собран') : null,
    );
  }

  function setsOverview() {
    return h('div', { class: 'sets' }, data.collections.filter((c) => c.isSet).map((c) =>
      h('button', { class: `sets__item ${c.complete ? 'is-complete' : ''}`, onClick: () => { filter = c.id; draw(); } },
        h('span', {}, c.title), h('b', {}, `${c.owned}/${c.total}`))));
  }

  function card(d) {
    if (!d.owned) {
      return h('div', { class: 'doll-card is-locked', 'aria-label': `Неполученная кукла из набора ${d.collectionTitle}` },
        h('div', { class: 'doll-card__img' }, dollImage(d.id, { locked: true }), h('span', { class: 'doll-card__lock', html: lockSvg })),
        h('b', {}, '???'),
        h('small', {}, d.collectionTitle),
      );
    }
    return h('button', { class: 'doll-card', onClick: () => details(d), 'aria-label': `${d.name}, ${d.points} очков` },
      h('div', { class: 'doll-card__img' }, dollImage(d.id, { alt: '' }),
        d.copies > 1 ? h('span', { class: 'doll-card__copies' }, `×${d.copies}`) : null),
      h('b', {}, d.name),
      h('small', {}, `${d.points} очков`),
    );
  }

  function details(d) {
    openModal([
      h('div', { class: 'reveal' },
        h('div', { class: 'reveal__img' }, dollImage(d.id, { alt: d.name })),
        h('div', { class: 'reveal__meta' }, categoryChip(d.category, d.categoryTitle), h('span', { class: 'chip chip--rare' }, `${d.points} очков`)),
        h('h2', {}, d.name),
        h('p', {}, d.description),
        h('ul', { class: 'facts' },
          h('li', {}, h('span', {}, 'Набор'), h('b', {}, d.collectionTitle)),
          h('li', {}, h('span', {}, 'Получена'), h('b', {}, dateRu(d.obtainedAt))),
          h('li', {}, h('span', {}, 'Экземпляров'), h('b', {}, String(d.copies))),
        ),
      ),
    ]);
  }

  draw();
}

const lockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
