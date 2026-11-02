import { h } from '../utils/dom.js';
import { icon } from './icons.js';

const ITEMS = [
  { route: 'map', label: 'Городок', icon: 'home' },
  { route: 'game', label: 'Слова', icon: 'game' },
  { route: 'gacha', label: 'Подарки', icon: 'gift' },
  { route: 'collection', label: 'Куклы', icon: 'heart' },
  { route: 'profile', label: 'Профиль', icon: 'user' },
];

export function renderNav(active) {
  return h('nav', { class: 'nav', 'aria-label': 'Основное меню' },
    ITEMS.map((it) => h('a', {
      class: `nav__item ${active === it.route ? 'is-active' : ''}`,
      href: `#/${it.route === 'map' ? '' : it.route}`,
      'aria-current': active === it.route ? 'page' : null,
    }, h('span', { html: icon(it.icon), style: { display: 'contents' } }), it.label)),
  );
}
