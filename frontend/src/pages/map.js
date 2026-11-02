import { h } from '../utils/dom.js';
import { renderHud } from '../components/hud.js';
import { state, setMe, onMe } from '../state.js';
import { api } from '../api.js';

// Здания на карте. Координаты — в пикселях исходной картинки карты 390×693.
const BUILDINGS = [
  { id: 'gacha', route: 'gacha', title: 'Бутик подарков', box: [14, 44, 130, 168] },
  { id: 'dolls', route: 'collection', title: 'Домик кукол', box: [228, 52, 140, 180] },
  { id: 'words', route: 'game', title: 'Словесный домик', box: [70, 236, 180, 182], main: true },
  { id: 'calendar', route: 'calendar', title: 'Календарь подарков', label: 'Календарь', box: [14, 424, 130, 148] },
  { id: 'missions', route: 'missions', title: 'Доска заданий', label: 'Задания', box: [236, 424, 140, 148] },
  { id: 'rating', route: 'rating', title: 'Зал рейтинга', box: [120, 556, 150, 137] },
];
const W = 390, H = 693;
const pct = (v, total) => `${(v / total) * 100}%`;

export async function mapPage(view, { go }) {
  const hud = renderHud();
  const page = h('div', { class: 'map-page' }, hud);
  let map = null;

  const draw = (me) => {
    const extra = (b) => {
      if (b.id === 'words') return h('span', { class: 'map-label__lv' }, `Ур. ${me.player.level}`);
      if (b.id === 'rating' && me.place) return h('span', { class: 'map-label__lv' }, `#${me.place}`);
      if (b.id === 'dolls') return h('span', { class: 'map-label__lv' }, `${me.collection.unique}`);
      return null;
    };
    const badge = (b) => {
      const n = b.id === 'calendar' ? me.badges?.calendar : b.id === 'missions' ? me.badges?.missions : 0;
      return n ? h('span', { class: 'badge', 'aria-hidden': 'true' }, String(n)) : null;
    };
    const next = h('div', { class: 'map' },
      h('img', { class: 'map__img', src: '/assets/images/map.png', alt: 'Зимний городок DOLLARIA' }),
      BUILDINGS.map((b) => h('button', {
        class: `map__spot ${b.main ? 'map__spot--main' : ''}`,
        style: { left: pct(b.box[0], W), top: pct(b.box[1], H), width: pct(b.box[2], W), height: pct(b.box[3], H) },
        'aria-label': b.title,
        onClick: () => go(b.route),
      },
      h('span', { class: `map-label ${b.main ? 'map-label--main' : ''}` }, b.label || b.title, extra(b), badge(b)))),
      h('span', { class: 'map__play', 'aria-hidden': 'true', style: { left: pct(40, W), top: pct(270, H) } }, 'Играть'),
    );
    if (map) map.replaceWith(next); else page.append(next);
    map = next;
  };

  draw(state.me);
  view.append(page);
  const off = onMe(draw);
  // Тихо обновляем данные игрока (баланс, значки), не мешая игре
  api.me().then(setMe).catch(() => {});
  return () => { off(); hud.dispose?.(); };
}
