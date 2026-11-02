import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { duration } from '../utils/format.js';

export async function ratingPage(view, { go }) {
  view.append(h('div', { class: 'spinner' }));
  const data = await api.leaderboard();
  const [first, second, third] = data.top;

  const avatar = (p, size) => {
    const img = h('img', { src: p?.photoUrl || '/assets/icons/avatar.png', alt: '', class: p?.photoUrl ? 'smooth' : '' });
    img.addEventListener('error', () => { img.src = '/assets/icons/avatar.png'; img.className = ''; }, { once: true });
    return h('span', { class: 'ava', style: { width: `${size}px`, height: `${size}px` } }, img);
  };
  const podium = (p, place) => h('div', { class: `podium__col podium__col--${place}` },
    place === 1 ? h('span', { class: 'podium__crown-px', 'aria-hidden': 'true' }) : null,
    avatar(p, place === 1 ? 64 : 52),
    h('b', {}, p ? p.name : '—'),
    h('small', {}, p ? `${p.points} очков · ${p.uniqueDolls} кукол` : 'место свободно'),
    h('span', { class: 'podium__step' }, String(place)),
  );
  const row = (p, mine = false) => h('li', { class: `rank-row ${mine ? 'is-me' : ''}` },
    h('span', { class: 'rank-row__place' }, `#${p.place}`),
    avatar(p, 38),
    h('span', { class: 'rank-row__name' }, mine ? `Вы · ${p.name}` : p.name, h('small', {}, `${p.uniqueDolls} кукол · наборов: ${p.setsDone}`)),
    h('b', {}, String(p.points)),
  );

  const left = new Date(data.contestEnd) - Date.now();
  clear(view).append(h('div', { class: 'page rating' },
    h('h1', { class: 'page-title page-title--light' }, 'Зал рейтинга'),
    h('p', { class: 'page-sub' }, data.contestOver ? 'Соревнование завершено. Итоги подводятся.' : `До конца соревнования: ${duration(left)}`),
    h('button', { class: 'prize', onClick: () => go('rules') },
      h('img', { src: '/assets/images/giftbox.png', alt: '' }),
      h('span', {}, h('b', {}, 'Главный приз — настоящая кукла'), h('small', {}, 'Правила соревнования')),
    ),
    h('div', { class: 'podium' }, podium(second, 2), podium(first, 1), podium(third, 3)),
    data.top.length > 3
      ? h('ol', { class: 'rank-list' }, data.top.slice(3).map((p) => row(p, data.me && p.playerId === data.me.playerId)))
      : null,
    !data.top.length ? h('p', { class: 'empty' }, 'Рейтинг пока пуст. Откройте первый подарок — и вы в списке!') : null,
    h('div', { class: 'rank-me' },
      data.me ? row(data.me, true) : h('p', {}, 'Вас пока нет в рейтинге — получите первую куклу в бутике.'),
      h('small', {}, `Участников: ${data.totalPlayers}`),
    ),
  ));
}
