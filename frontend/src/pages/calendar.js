import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { setBalances, setMe } from '../state.js';
import { haptic } from '../telegram.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { rewardTiles } from '../components/currency.js';
import { dollImage } from '../components/doll.js';

const SEASON_TEXT = {
  before: 'Календарь откроется 1 декабря. Каждый день — новый подарок.',
  active: 'Открывайте подарок каждый день. Пропуск не сбрасывает календарь.',
  after: 'Сезон календаря завершён. Спасибо, что были с нами!',
};

export async function calendarPage(view) {
  view.append(h('div', { class: 'spinner' }));
  let cal = await api.calendar();

  function draw() {
    clear(view).append(h('div', { class: 'page calendar' },
      h('h1', { class: 'page-title page-title--light' }, 'Календарь подарков'),
      h('p', { class: 'page-sub' }, SEASON_TEXT[cal.season]),
      h('div', { class: 'panel panel--garland calendar__board' },
        h('div', { class: 'calendar__grid' }, cal.days.map(dayCell)),
        h('p', { class: 'calendar__note' }, '24, 25 и 31 декабря — особые подарки. 31 декабря — кукла, которую можно получить только здесь.'),
      ),
    ));
  }

  function dayCell(d) {
    const cls = `day day--${d.status} ${d.special ? 'day--special' : ''}`;
    if (d.status === 'today') {
      return h('button', { class: cls, onClick: claim, 'aria-label': `${d.day} декабря — открыть подарок` },
        h('img', { src: '/assets/images/giftbox.png', alt: '' }), h('b', {}, `${d.day}`), h('small', {}, 'Открыть'));
    }
    const label = d.status === 'claimed' ? 'получено' : d.status === 'missed' ? 'пропущен' : 'ещё закрыт';
    return h('div', { class: cls, 'aria-label': `${d.day} декабря — ${label}` },
      h('b', {}, `${d.day}`),
      d.status === 'claimed' ? h('small', {}, '✓') : d.status === 'missed' ? h('small', {}, 'пропущен') : null);
  }

  async function claim() {
    try {
      const res = await api.claimCalendar();
      setBalances(res.balances);
      haptic('success');
      openModal([
        h('h2', {}, `${res.day} декабря`),
        h('p', { style: { textAlign: 'center' } }, 'Ваш подарок дня:'),
        rewardTiles(res.reward),
        res.doll ? h('div', { class: 'reveal reveal--legendary' },
          h('div', { class: 'reveal__img' }, dollImage(res.doll.id, { alt: res.doll.name })),
          h('h2', {}, res.doll.name), h('p', {}, `Особая кукла календаря · ${res.doll.points} очков`)) : null,
      ]);
      cal = await api.calendar();
      draw();
      api.me().then(setMe).catch(() => {});
    } catch (e) { toast(e.message); }
  }

  draw();
}
