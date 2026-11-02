import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { setBalances, setMe } from '../state.js';
import { haptic } from '../telegram.js';
import { toast } from '../components/toast.js';
import { inlineCost } from '../components/currency.js';
import { duration, dateRu } from '../utils/format.js';

const TABS = [
  { id: 'day', title: 'Сегодня' },
  { id: 'week', title: 'Неделя' },
  { id: 'season', title: 'Особые' },
];

export async function missionsPage(view) {
  view.append(h('div', { class: 'spinner' }));
  let data = await api.missions();
  let tab = 'day';

  function note() {
    if (tab === 'day') return `Новые задания через ${duration(data.resetsInMs)}`;
    if (tab === 'week') return `Обновятся вместе с коллекцией недели после ${dateRu(data.weekEndsOn)}`;
    return 'Праздничные цели на весь сезон';
  }

  function draw() {
    const list = data.missions.filter((m) => m.period === tab);
    clear(view).append(h('div', { class: 'page missions' },
      h('h1', { class: 'page-title page-title--light' }, 'Доска заданий'),
      h('div', { class: 'tabs tabs--even', role: 'tablist' }, TABS.map((t) => {
        const n = data.missions.filter((m) => m.period === t.id && m.done && !m.claimed).length;
        return h('button', {
          class: `tab ${tab === t.id ? 'is-active' : ''}`, role: 'tab', 'aria-selected': String(tab === t.id),
          onClick: () => { tab = t.id; draw(); }, style: { position: 'relative' },
        }, t.title, n ? h('span', { class: 'badge' }, String(n)) : null);
      })),
      h('p', { class: 'page-sub' }, note()),
      h('div', { class: 'mission-list' }, list.map(item)),
    ));
  }

  function item(m) {
    const pct = Math.round((m.progress / m.goal) * 100);
    return h('div', { class: `mission ${m.done && !m.claimed ? 'is-ready' : ''}` },
      h('div', { class: 'mission__reward' }, ['tickets', 'snowflakes', 'ribbons'].filter((k) => m.reward[k]).map((k) => inlineCost(k, m.reward[k]))),
      h('div', { class: 'mission__body' },
        h('b', {}, m.title),
        h('div', { class: 'mission__bar' },
          h('div', { class: `progress ${m.done ? 'progress--gold' : ''}` }, h('span', { style: { width: `${pct}%` } })),
          h('span', {}, `${m.progress}/${m.goal}`)),
      ),
      m.claimed
        ? h('span', { class: 'mission__done' }, 'Получено')
        : h('button', { class: 'btn btn--small btn--primary', disabled: !m.done, onClick: () => claim(m) }, 'Забрать'),
    );
  }

  async function claim(m) {
    try {
      const res = await api.claimMission(m.id);
      setBalances(res.balances);
      haptic('success');
      toast('Награда получена', 'good');
      data = await api.missions();
      draw();
      api.me().then(setMe).catch(() => {});
    } catch (e) { toast(e.message); }
  }

  draw();
}
