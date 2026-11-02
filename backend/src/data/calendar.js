// Новогодний календарь: награда на каждый день декабря 2026 года.
// doll — id куклы, которую дарит календарь (только 31 декабря).
export const CALENDAR_YEAR = 2026;
export const CALENDAR_MONTH = 12;

const base = (day) => {
  if (day % 7 === 0) return { tickets: 2 };
  if (day % 5 === 0) return { ribbons: 10, snowflakes: 30 };
  if (day % 3 === 0) return { tickets: 1, snowflakes: 20 };
  return { snowflakes: 40 };
};

export const CALENDAR_REWARDS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  if (day === 24) return { day, special: true, reward: { tickets: 3, snowflakes: 100 } };
  if (day === 25) return { day, special: true, reward: { tickets: 3, ribbons: 20 } };
  if (day === 31) return { day, special: true, reward: { tickets: 5, doll: 'ex-new-year' } };
  return { day, special: false, reward: base(day) };
});
