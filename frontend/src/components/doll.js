import { h } from '../utils/dom.js';

const PLACEHOLDER = '/assets/dolls/placeholder.svg';

// Изображение куклы. Если картинки ещё нет в /assets/dolls — показываем заглушку.
export function dollImage(id, { locked = false, alt = '' } = {}) {
  const img = h('img', {
    class: `doll-img smooth ${locked ? 'is-locked' : ''}`,
    src: locked ? PLACEHOLDER : `/assets/dolls/${id}.png`,
    alt,
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => { if (!img.src.endsWith(PLACEHOLDER)) img.src = PLACEHOLDER; }, { once: true });
  return img;
}

export function categoryChip(category, title) {
  return h('span', { class: `chip chip--${category}` }, title);
}
