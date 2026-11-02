// Задания. period: day — обновляется каждый день, week — вместе с коллекцией недели, season — на весь сезон.
// event — какое игровое событие засчитывается, goal — сколько нужно.
export const MISSIONS = [
  { id: 'd-login', period: 'day', title: 'Зайти в игру', event: 'login', goal: 1, reward: { snowflakes: 10 } },
  { id: 'd-levels', period: 'day', title: 'Пройти 5 уровней', event: 'level_complete', goal: 5, reward: { tickets: 1 } },
  { id: 'd-extra', period: 'day', title: 'Найти 10 дополнительных слов', event: 'extra_word', goal: 10, reward: { snowflakes: 40 } },
  { id: 'd-gacha', period: 'day', title: 'Открыть один подарок', event: 'gacha_open', goal: 1, reward: { snowflakes: 30 } },
  { id: 'd-newdoll', period: 'day', title: 'Получить новую куклу', event: 'new_doll', goal: 1, reward: { ribbons: 5 } },

  { id: 'w-levels', period: 'week', title: 'Пройти 30 уровней', event: 'level_complete', goal: 30, reward: { tickets: 3 } },
  { id: 'w-gacha', period: 'week', title: 'Открыть 10 подарков', event: 'gacha_open', goal: 10, reward: { tickets: 2 } },
  { id: 'w-newdoll', period: 'week', title: 'Собрать 3 новых куклы', event: 'new_doll', goal: 3, reward: { ribbons: 15 } },
  { id: 'w-extra', period: 'week', title: 'Найти 50 дополнительных слов', event: 'extra_word', goal: 50, reward: { tickets: 1 } },

  { id: 's-firstgift', period: 'season', title: 'Открыть первый новогодний подарок', event: 'gacha_open', goal: 1, reward: { tickets: 1 } },
  { id: 's-set', period: 'season', title: 'Собрать полный набор кукол', event: 'set_complete', goal: 1, reward: { tickets: 3 } },
  { id: 's-levels', period: 'season', title: 'Пройти 100 уровней', event: 'level_complete', goal: 100, reward: { tickets: 5 } },
  { id: 's-days', period: 'season', title: 'Заходить в игру 7 разных дней', event: 'login', goal: 7, reward: { tickets: 2 } },
  { id: 's-calendar', period: 'season', title: 'Открыть 20 подарков календаря', event: 'calendar_claim', goal: 20, reward: { tickets: 3 } },
];
