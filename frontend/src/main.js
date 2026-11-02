import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

import { initTelegram, insideTelegram, setBack } from './telegram.js';
import { api } from './api.js';
import { setMe } from './state.js';
import { h, clear } from './utils/dom.js';
import { renderNav } from './components/nav.js';
import { toast } from './components/toast.js';

import { mapPage } from './pages/map.js';
import { gamePage } from './pages/game.js';
import { gachaPage } from './pages/gacha.js';
import { collectionPage } from './pages/collection.js';
import { calendarPage } from './pages/calendar.js';
import { missionsPage } from './pages/missions.js';
import { ratingPage } from './pages/rating.js';
import { rulesPage } from './pages/rules.js';
import { profilePage } from './pages/profile.js';

// Маршруты: #/ — карта, #/game — слова и т.д. navKey — какой пункт меню подсветить.
const ROUTES = {
  '': { page: mapPage, navKey: 'map' },
  game: { page: gamePage, navKey: 'game' },
  gacha: { page: gachaPage, navKey: 'gacha' },
  collection: { page: collectionPage, navKey: 'collection' },
  calendar: { page: calendarPage, navKey: null },
  missions: { page: missionsPage, navKey: null },
  rating: { page: ratingPage, navKey: null },
  rules: { page: rulesPage, navKey: null, back: 'rating' },
  profile: { page: profilePage, navKey: 'profile' },
};

const app = document.getElementById('app');
let cleanup = null;

export function go(route) {
  location.hash = `#/${route}`;
}

async function render() {
  const key = location.hash.replace(/^#\/?/, '').split('?')[0];
  const route = ROUTES[key] || ROUTES[''];
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }

  const view = h('main', { class: 'view', id: 'view' });
  clear(app).append(view, renderNav(route.navKey));
  setBack(key ? () => go(route.back || '') : null);
  try {
    cleanup = (await route.page(view, { go })) || null;
  } catch (e) {
    console.error(e);
    clear(view).append(h('div', { class: 'page' }, h('div', { class: 'empty' }, e.message || 'Не удалось открыть раздел'),
      h('button', { class: 'btn btn--primary btn--wide', onClick: render }, 'Попробовать снова')));
  }
}

async function boot() {
  initTelegram();
  if (!insideTelegram && !import.meta.env.VITE_DEV_USER) {
    clear(app).append(h('div', { class: 'boot' },
      h('img', { src: '/assets/icons/app-icon-512.png', alt: '', class: 'boot__gift', style: { borderRadius: '50%' } }),
      h('p', { class: 'boot__text', style: { textAlign: 'center', padding: '0 24px' } }, 'Игра открывается внутри Telegram. Найдите бота DOLLARIA и нажмите «Играть».'),
    ));
    return;
  }
  try {
    const me = await api.me();
    setMe(me);
    if (me.loginReward) setTimeout(() => toast(`Подарок за вход: +${me.loginReward.snowflakes} снежинок`, 'good'), 600);
  } catch (e) {
    clear(app).append(h('div', { class: 'boot' },
      h('img', { src: '/assets/images/giftbox.png', alt: '', class: 'boot__gift' }),
      h('p', { class: 'boot__text', style: { textAlign: 'center', padding: '0 24px' } }, e.message),
      h('button', { class: 'btn btn--primary', onClick: boot }, 'Попробовать снова')));
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

boot();
