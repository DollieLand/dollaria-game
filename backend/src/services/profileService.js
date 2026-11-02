import { query } from '../database/db.js';
import { balances } from './rewardService.js';
import { playerScore } from './collectionService.js';
import { placeOf } from './leaderboardService.js';
import { displayName } from './playerService.js';
import { categoryTitle } from './catalogService.js';

const SOURCE_TITLES = {
  start: 'Стартовый подарок', daily_login: 'Ежедневный вход', level_complete: 'Уровень пройден',
  extra_word: 'Дополнительное слово', calendar: 'Новогодний календарь', mission: 'Задание',
  duplicate: 'Лента за дубликат', gacha: 'Открытие подарка', hint_letter: 'Подсказка: буква',
  hint_word: 'Подсказка: слово', ribbon_exchange: 'Обмен лент', ribbon_exchange_cost: 'Обмен лент',
};

export async function summary(player) {
  const [bal, score, place] = await Promise.all([balances({ query }, player.id), playerScore(player.id), placeOf(player.id)]);
  return {
    player: { id: player.id, name: displayName(player), username: player.username, photoUrl: player.photo_url, level: player.current_level },
    balances: bal,
    collection: { unique: score.unique_dolls || 0, points: score.points || 0, setsDone: score.sets_done || 0 },
    place,
  };
}

export async function profile(player) {
  const base = await summary(player);
  const stats = await query(
    `SELECT
      (SELECT count(*) FROM level_progress WHERE player_id = $1 AND completed_at IS NOT NULL)::int AS levels_completed,
      (SELECT COALESCE(sum(cardinality(found_words) + cardinality(extra_words)), 0) FROM level_progress WHERE player_id = $1)::int AS words_found,
      (SELECT count(*) FROM gacha_history WHERE player_id = $1)::int AS gifts_opened,
      (SELECT count(*) FROM game_events WHERE player_id = $1 AND type = 'login')::int AS days_played,
      (SELECT COALESCE(max(level_number), 0) FROM level_progress WHERE player_id = $1 AND completed_at IS NOT NULL)::int AS best_level`,
    [player.id],
  );
  const best = await query(
    `SELECT d.name, d.category, d.points FROM player_dolls pd JOIN dolls d ON d.id = pd.doll_id
     WHERE pd.player_id = $1 ORDER BY d.points DESC, pd.first_obtained_at ASC LIMIT 1`, [player.id]);
  const hist = await query(
    `SELECT source, snowflakes, tickets, ribbons, note, created_at FROM reward_ledger
     WHERE player_id = $1 ORDER BY id DESC LIMIT 40`, [player.id]);
  return {
    ...base,
    stats: {
      ...stats.rows[0],
      bestDoll: best.rows[0] ? { name: best.rows[0].name, categoryTitle: categoryTitle(best.rows[0].category), points: best.rows[0].points } : null,
    },
    history: hist.rows.map((h) => ({
      title: h.note || SOURCE_TITLES[h.source] || h.source,
      snowflakes: h.snowflakes, tickets: h.tickets, ribbons: h.ribbons, at: h.created_at,
    })),
  };
}
