import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { setMe, state } from '../state.js';
import { currencyButton } from '../components/currency.js';
import { avatarSrc } from '../components/hud.js';
import { dateTimeRu } from '../utils/format.js';

export async function profilePage(view, { go }) {
  view.append(h('div', { class: 'spinner' }));
  const p = await api.profile();
  setMe({ ...state.me, ...p, badges: state.me?.badges });
  const s = p.stats;
  let sound = true;
  try { sound = localStorage.getItem('dollaria:sound') !== 'off'; } catch { /* ignore */ }

  const img = h('img', { src: avatarSrc(p), alt: '', class: 'smooth' });
  img.addEventListener('error', () => { img.src = '/assets/icons/avatar.png'; img.className = ''; }, { once: true });

  const amount = (r) => ['tickets', 'snowflakes', 'ribbons']
    .filter((k) => r[k])
    .map((k) => `${r[k] > 0 ? '+' : ''}${r[k]} ${{ tickets: 'бил.', snowflakes: 'снеж.', ribbons: 'лент' }[k]}`).join(', ');

  clear(view).append(h('div', { class: 'page profile' },
    h('div', { class: 'profile__head' },
      h('span', { class: 'profile__ava' }, img),
      h('div', {},
        h('h1', {}, p.player.name),
        p.player.username ? h('p', {}, `@${p.player.username}`) : null,
        h('span', { class: 'chip chip--legendary' }, `Уровень ${p.player.level}`),
      ),
    ),
    h('div', { class: 'profile__money' },
      currencyButton('snowflakes', p.balances.snowflakes),
      currencyButton('tickets', p.balances.tickets),
      currencyButton('ribbons', p.balances.ribbons),
    ),
    h('div', { class: 'stats4' },
      stat(p.place ? `#${p.place}` : '—', 'место'),
      stat(p.collection.points, 'очков'),
      stat(p.collection.unique, 'кукол'),
      stat(p.collection.setsDone, 'наборов'),
    ),
    h('section', { class: 'panel' },
      h('h2', { class: 'section-title' }, 'Статистика'),
      h('ul', { class: 'facts' },
        fact('Пройдено уровней', s.levels_completed),
        fact('Самый высокий уровень', s.best_level),
        fact('Всего найдено слов', s.words_found),
        fact('Открыто подарков', s.gifts_opened),
        fact('Дней в игре', s.days_played),
        fact('Самая ценная кукла', s.bestDoll ? `${s.bestDoll.name} (${s.bestDoll.points})` : '—'),
      ),
    ),
    h('section', { class: 'panel' },
      h('h2', { class: 'section-title' }, 'История наград'),
      p.history.length
        ? h('ul', { class: 'list' }, p.history.map((x) => h('li', {},
          h('span', {}, x.title, h('br'), h('small', {}, dateTimeRu(x.at))),
          h('b', { class: (x.snowflakes + x.tickets + x.ribbons) < 0 ? 'is-minus' : '' }, amount(x)))))
        : h('p', { class: 'empty' }, 'Здесь появятся ваши награды.'),
    ),
    h('section', { class: 'panel' },
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: sound, onChange: (e) => { try { localStorage.setItem('dollaria:sound', e.target.checked ? 'on' : 'off'); } catch { /* ignore */ } } }),
        'Звуки в игре'),
      h('button', { class: 'link', onClick: () => go('rules') }, 'Правила соревнования'),
    ),
  ));
}

const stat = (v, l) => h('div', { class: 'stat' }, h('b', {}, String(v)), h('span', {}, l));
const fact = (k, v) => h('li', {}, h('span', {}, k), h('b', {}, String(v)));
