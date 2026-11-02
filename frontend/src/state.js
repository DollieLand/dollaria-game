// Общее состояние игрока на клиенте. Источник правды — сервер; здесь только копия для отображения.
const listeners = new Set();
export const state = { me: null };

export function setMe(me) {
  state.me = me;
  listeners.forEach((fn) => fn(me));
}

export function setBalances(balances) {
  if (!state.me || !balances) return;
  setMe({ ...state.me, balances });
}

export function onMe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
