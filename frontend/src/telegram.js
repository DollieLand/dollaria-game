// Интеграция с Telegram Mini Apps (официальный скрипт telegram-web-app.js подключён в index.html)
const tg = window.Telegram?.WebApp;

export const insideTelegram = !!(tg && tg.initData);

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  const at = (v) => tg.isVersionAtLeast?.(v);
  if (at('7.7')) tg.disableVerticalSwipes(); // чтобы свайп по буквам не закрывал игру
  if (at('6.1')) { tg.setHeaderColor?.('#CF7A86'); tg.setBackgroundColor?.('#CF7A86'); }
  if (at('7.10')) tg.setBottomBarColor?.('#FFF4E8');
  const mobile = ['ios', 'android'].includes(tg.platform);
  if (mobile && at('8.0')) {
    try { tg.requestFullscreen(); tg.lockOrientation?.(); } catch { /* не все клиенты поддерживают */ }
  }
}

export function initData() {
  return tg?.initData || '';
}

export function tgUser() {
  return tg?.initDataUnsafe?.user || null; // только для показа аватара — личность проверяет сервер
}

export function haptic(kind = 'light') {
  const hf = tg?.HapticFeedback;
  if (!hf) return;
  if (kind === 'success' || kind === 'error' || kind === 'warning') hf.notificationOccurred(kind);
  else hf.impactOccurred(kind);
}

let backHandler = null;
export function setBack(handler) {
  if (!tg?.BackButton) return;
  if (backHandler) tg.BackButton.offClick(backHandler);
  backHandler = handler;
  if (handler) { tg.BackButton.onClick(handler); tg.BackButton.show(); } else tg.BackButton.hide();
}

export function openLink(url) {
  if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank', 'noopener');
}
