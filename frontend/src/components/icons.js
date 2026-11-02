// Простые контурные иконки для меню (статичный SVG, без пользовательских данных)
const s = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const ICONS = {
  home: s('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  game: s('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  gift: s('<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M2 9h20M12 9v12M12 9c-2-4-7-5-7-2s5 2 7 2c2 0 7 1 7-2s-5-2-7 2"/>'),
  heart: s('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  shuffle: s('<path d="M3 7h4c4 0 6 10 10 10h4M18 14l3 3-3 3M3 17h4c1.5 0 2.7-1.4 3.7-3M14 10c1-1.6 2-3 3-3h4M18 4l3 3-3 3"/>'),
  bulb: s('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'),
  book: s('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
  gear: s('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  lock: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  check: s('<path d="M5 12l5 5 9-10"/>'),
  word: s('<rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="7" width="6" height="10" rx="1"/><rect x="16" y="7" width="6" height="10" rx="1"/>'),
};
export const icon = (name) => ICONS[name] || '';
