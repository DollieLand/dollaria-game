// Звуки необязательны: если файла нет в /assets/sounds, ничего не произойдёт.
const cache = {};
export function play(name) {
  try {
    if (localStorage.getItem('dollaria:sound') === 'off') return;
  } catch { /* хранилище может быть недоступно */ }
  const a = cache[name] || (cache[name] = new Audio(`/assets/sounds/${name}.mp3`));
  a.currentTime = 0;
  a.play().catch(() => {});
}
