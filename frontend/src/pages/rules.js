import { h } from '../utils/dom.js';
import { RULES } from '../data/rules.js';

export async function rulesPage(view, { go }) {
  view.append(h('div', { class: 'page rules' },
    h('h1', { class: 'page-title page-title--light' }, 'Правила соревнования'),
    RULES.map((s) => h('section', { class: 'panel rules__section' },
      h('h2', {}, s.title),
      s.text.map((t) => h('p', {}, t)),
    )),
    h('button', { class: 'btn btn--wide', onClick: () => go('rating') }, 'Вернуться к рейтингу'),
  ));
}
