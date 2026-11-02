import { h } from '../utils/dom.js';
import { currencyButton } from './currency.js';
import { state, onMe } from '../state.js';
import { tgUser } from '../telegram.js';

export function avatarSrc(me) {
  return me?.player?.photoUrl || tgUser()?.photo_url || '/assets/icons/avatar.png';
}

// Верхняя панель: аватар, имя, уровень, валюты. Обновляется сама при изменении баланса.
export function renderHud() {
  const root = h('header', { class: 'hud' });
  const draw = (me) => {
    if (!me) return;
    const img = h('img', { src: avatarSrc(me), alt: '', class: 'smooth' });
    img.addEventListener('error', () => { img.src = '/assets/icons/avatar.png'; img.classList.remove('smooth'); }, { once: true });
    root.replaceChildren(
      h('a', { class: 'hud__player', href: '#/profile', 'aria-label': `Профиль: ${me.player.name}` },
        h('span', { class: 'hud__avatar' }, img),
        h('span', { class: 'hud__plate' },
          h('span', { class: 'hud__name' }, me.player.name),
          h('span', { class: 'hud__meta' }, `Ур. ${me.player.level} · ${me.collection.unique} кукол · ${me.place ? '#' + me.place : 'без места'}`),
        ),
      ),
      h('div', { class: 'hud__money' },
        currencyButton('snowflakes', me.balances.snowflakes),
        currencyButton('tickets', me.balances.tickets),
        currencyButton('ribbons', me.balances.ribbons),
      ),
    );
  };
  draw(state.me);
  const off = onMe(draw);
  root.dispose = off;
  return root;
}
