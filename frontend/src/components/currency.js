import { h } from '../utils/dom.js';
import { num } from '../utils/format.js';
import { openModal } from './modal.js';

export const CURRENCY = {
  snowflakes: {
    icon: '/assets/icons/ico_snow.png', title: 'Снежинки', short: 'снежинок',
    text: 'Основная валюта. Начисляется за пройденные уровни, дополнительные слова, ежедневный вход, задания и календарь. Тратится на подсказки в словесной игре.',
  },
  tickets: {
    icon: '/assets/icons/ico_ticket.png', title: 'Подарочные билеты', short: 'билетов',
    text: 'Самая важная валюта для коллекции. Выдаётся за каждый третий уровень, задания и календарь. Один билет — одно открытие подарка в бутике.',
  },
  ribbons: {
    icon: '/assets/icons/ico_ribbon.png', title: 'Ленты', short: 'лент',
    text: 'Приходят вместо куклы, если такая уже есть в коллекции. Ленты можно обменять на подарочные билеты в бутике.',
  },
};

export function explainCurrency(kind) {
  const c = CURRENCY[kind];
  openModal([
    h('img', { src: c.icon, alt: '', style: { width: '56px', height: '56px', display: 'block', margin: '0 auto 8px' } }),
    h('h2', {}, c.title),
    h('p', {}, c.text),
    h('p', { style: { marginTop: '10px', fontSize: '13px', color: 'var(--text-soft)' } }, 'Все ресурсы в игре бесплатные — их нельзя купить за деньги.'),
  ]);
}

export function currencyButton(kind, amount) {
  const c = CURRENCY[kind];
  return h('button', { class: 'cur', 'aria-label': `${c.title}: ${amount}. Что это?`, onClick: () => explainCurrency(kind) },
    h('span', { class: 'cur__amount' }, num(amount)),
    h('img', { src: c.icon, alt: '' }),
  );
}

export function inlineCost(kind, amount) {
  return h('span', { class: 'cur-inline' }, h('img', { src: CURRENCY[kind].icon, alt: CURRENCY[kind].title }), num(amount));
}

// Плитки наград: { snowflakes: 10, tickets: 1 } → набор плиток
export function rewardTiles(reward = {}) {
  const tiles = ['tickets', 'snowflakes', 'ribbons']
    .filter((k) => reward[k] > 0)
    .map((k) => h('div', { class: 'reward-tile' }, h('img', { src: CURRENCY[k].icon, alt: '' }), `+${num(reward[k])}`, h('small', {}, CURRENCY[k].title)));
  return h('div', { class: 'reward-row' }, tiles);
}
