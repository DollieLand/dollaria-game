import { h } from '../utils/dom.js';

// Открывает окно. content — элемент или массив элементов. Возвращает функцию закрытия.
export function openModal(content, { garland = true, closable = true, onClose } = {}) {
  const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape' && closable) close(); };
  const modal = h('div', { class: `modal ${garland ? 'modal--garland' : ''}`, role: 'dialog', 'aria-modal': 'true' },
    closable ? h('button', { class: 'modal__close', 'aria-label': 'Закрыть', onClick: close }, '×') : null,
    content,
  );
  const backdrop = h('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === backdrop && closable) close(); } }, modal);
  document.getElementById('app').append(backdrop);
  document.addEventListener('keydown', onKey);
  return close;
}
