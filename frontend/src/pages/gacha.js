import { h, clear } from '../utils/dom.js';
import { api } from '../api.js';
import { state, setBalances, setMe } from '../state.js';
import { haptic } from '../telegram.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { currencyButton, inlineCost } from '../components/currency.js';
import { dollImage, categoryChip } from '../components/doll.js';
import { dateRu, dateTimeRu, uuid } from '../utils/format.js';
import { play } from '../utils/sound.js';

export async function gachaPage(view, { go }) {
  view.append(h('div', { class: 'spinner' }));
  let banner = await api.gacha();
  let busy = false;

  function draw() {
    const b = state.me.balances;
    const canOpen = b.tickets >= banner.cost && !busy;
    const ex = banner.ribbonExchange;
    clear(view).append(h('div', { class: 'gacha' },
      h('div', { class: 'gacha__stage' },
        h('div', { class: 'gacha__top' },
          h('h1', { class: 'title-plate' }, 'Бутик подарков'),
          currencyButton('tickets', b.tickets),
        ),
        h('div', { class: 'gacha__banner' },
          h('span', { class: 'gacha__week' }, `Коллекция недели · до ${dateRu(banner.collection.endsOn)}`),
          h('h2', { class: 'gacha__title' }, banner.collection.title),
        ),
        h('img', { class: 'gacha__box', src: '/assets/images/giftbox.png', alt: 'Подарочная коробка' }),
      ),
      h('div', { class: 'gacha__cta' },
        h('button', { class: 'btn btn--primary btn--big btn--wide', disabled: !canOpen, onClick: openGift },
          'Открыть подарок', h('span', { class: 'gacha__price' }, inlineCost('tickets', banner.cost))),
        b.tickets < banner.cost
          ? h('p', { class: 'hint-text' }, 'Билеты дают за каждый третий уровень, задания и календарь.')
          : h('p', { class: 'hint-text' }, 'Повторная кукла превращается в ленты — очки за неё не дублируются.'),
        h('div', { class: 'gacha__row' },
          h('button', { class: 'btn btn--small', disabled: b.ribbons < ex.ribbons, onClick: exchange },
            `Обменять ${ex.ribbons} лент на ${ex.tickets} билет`),
          h('button', { class: 'btn btn--small', onClick: showHistory }, 'История'),
        ),
      ),
      h('section', { class: 'showcase' },
        h('h3', {}, 'Что может выпасть'),
        h('p', { class: 'hint-text' }, 'Шансы ниже — те же, что использует сервер при открытии. Сумма — 100%.'),
        h('div', { class: 'showcase__list' }, banner.dolls.map((d) => h('div', { class: 'showcase__card' },
          h('div', { class: 'showcase__img' }, dollImage(d.id, { locked: !d.owned, alt: d.name || 'Неизвестная кукла' }),
            h('span', { class: 'showcase__chance' }, `${d.chance}%`)),
          h('b', {}, d.name || '???'),
          categoryChip(d.category, d.categoryTitle),
          h('small', {}, `${d.points} очков · повтор: ${d.duplicateRibbons} лент`),
        ))),
      ),
    ));
  }

  async function openGift() {
    if (busy) return;
    busy = true;
    draw();
    const requestId = uuid();
    const overlay = h('div', { class: 'open-fx' },
      h('div', { class: 'open-fx__glow' }),
      h('img', { class: 'open-fx__box', src: '/assets/images/giftbox.png', alt: '' }),
    );
    document.getElementById('app').append(overlay);
    haptic('medium');
    let res;
    try {
      // Одинаковый requestId при повторе гарантирует, что билет не спишется дважды
      const [r] = await Promise.all([retry(() => api.openGift(requestId)), wait(1500)]);
      res = r;
    } catch (e) {
      overlay.remove();
      busy = false;
      toast(e.message);
      draw();
      return;
    }
    overlay.classList.add('is-open', `is-${res.doll.category}`);
    haptic(res.doll.category === 'legendary' ? 'success' : 'heavy');
    play('gift');
    await wait(res.doll.category === 'legendary' ? 1100 : 650);
    overlay.remove();
    setBalances(res.balances);
    busy = false;
    showResult(res);
    banner = await api.gacha().catch(() => banner);
    draw();
    api.me().then(setMe).catch(() => {});
  }

  function showResult(res) {
    const d = res.doll;
    openModal([
      h('div', { class: `reveal reveal--${d.category}` },
        h('p', { class: 'reveal__kicker' }, res.duplicate ? 'Эта кукла уже есть в коллекции' : 'Новая кукла!'),
        h('div', { class: 'reveal__img' }, dollImage(d.id, { alt: d.name })),
        h('div', { class: 'reveal__meta' }, categoryChip(d.category, d.categoryTitle), h('span', { class: 'chip chip--rare' }, `${d.points} очков`)),
        h('h2', {}, d.name),
        h('p', {}, d.description),
        res.duplicate ? h('p', { class: 'reveal__dup' }, `Вместо повтора — ${res.ribbons} лент`) : null,
        res.setCompleted ? h('p', { class: 'reveal__set' }, 'Набор собран полностью! Бонусные очки уже в рейтинге.') : null,
      ),
      h('div', { class: 'modal__actions' },
        h('button', { class: 'btn btn--gold btn--big btn--wide', onClick: (e) => { e.target.closest('.modal-backdrop').remove(); if (!res.duplicate) go('collection'); } },
          res.duplicate ? 'Хорошо' : 'Добавить в коллекцию'),
      ),
    ], { closable: true });
  }

  async function exchange() {
    try {
      const res = await api.exchange(uuid());
      setBalances(res.balances);
      haptic('success');
      toast('Ленты обменяны на билет', 'good');
      draw();
    } catch (e) { toast(e.message); }
  }

  async function showHistory() {
    const { history } = await api.gachaHistory();
    openModal([
      h('h2', {}, 'История подарков'),
      history.length
        ? h('ul', { class: 'list' }, history.map((x) => h('li', {},
          h('span', {}, h('b', {}, x.name), ` · ${x.collectionTitle}`, h('br'), h('small', {}, dateTimeRu(x.at))),
          h('span', {}, x.duplicate ? `+${x.ribbons} лент` : categoryChip(x.category, x.categoryTitle)))))
        : h('p', { class: 'empty' }, 'Вы ещё не открывали подарки.'),
    ]);
  }

  draw();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, times = 2) {
  try { return await fn(); } catch (e) {
    if (times > 0 && e.code === 'network') { await wait(800); return retry(fn, times - 1); }
    throw e;
  }
}
