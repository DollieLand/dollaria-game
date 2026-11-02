import { h } from '../utils/dom.js';

let box = null;
export function toast(text, kind = '') {
  if (!box || !box.isConnected) {
    box = h('div', { class: 'toasts', 'aria-live': 'polite' });
    document.getElementById('app').append(box);
  }
  const t = h('div', { class: `toast ${kind ? 'toast--' + kind : ''}` }, text);
  box.append(t);
  setTimeout(() => t.remove(), 2600);
}
