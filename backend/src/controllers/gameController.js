import * as levels from '../services/levelService.js';
import * as gacha from '../services/gachaService.js';
import * as calendar from '../services/calendarService.js';
import * as missions from '../services/missionService.js';
import * as board from '../services/leaderboardService.js';
import * as profileSvc from '../services/profileService.js';
import { playerCollection } from '../services/collectionService.js';
import { dailyLogin } from '../services/playerService.js';
import { int, oneOf, uuid, word } from '../utils/validate.js';

export async function me(req, res) {
  const loginReward = await dailyLogin(req.player.id);
  const [summary, mission, cal] = await Promise.all([
    profileSvc.summary(req.player),
    missions.listMissions(req.player.id),
    calendar.getCalendar(req.player.id),
  ]);
  res.json({
    ...summary,
    loginReward,
    badges: {
      missions: mission.claimable,
      calendar: cal.days.some((d) => d.status === 'today') ? 1 : 0,
    },
  });
}

export async function getLevel(req, res) {
  res.json(await levels.currentLevel(req.player));
}

export async function postWord(req, res) {
  const level = int(req.body.level, { min: 1, name: 'level' });
  res.json(await levels.submitWord(req.player, level, word(req.body.word)));
}

export async function postHint(req, res) {
  const level = int(req.body.level, { min: 1, name: 'level' });
  res.json(await levels.useHint(req.player, level, oneOf(req.body.kind, ['letter', 'word'], 'kind')));
}

export async function getGacha(req, res) {
  res.json(await gacha.currentBanner(req.player.id));
}

export async function postGachaOpen(req, res) {
  res.json(await gacha.openGift(req.player, uuid(req.body.requestId)));
}

export async function getGachaHistory(req, res) {
  res.json({ history: await gacha.history(req.player.id) });
}

export async function postExchange(req, res) {
  res.json(await gacha.exchangeRibbons(req.player, uuid(req.body.requestId)));
}

export async function getCollection(req, res) {
  res.json(await playerCollection(req.player.id));
}

export async function getCalendar(req, res) {
  res.json(await calendar.getCalendar(req.player.id));
}

export async function postCalendarClaim(req, res) {
  res.json(await calendar.claimToday(req.player.id));
}

export async function getMissions(req, res) {
  res.json(await missions.listMissions(req.player.id));
}

export async function postMissionClaim(req, res) {
  const id = String(req.body.missionId || '').slice(0, 40);
  res.json(await missions.claimMission(req.player.id, id));
}

export async function getLeaderboard(req, res) {
  res.json(await board.leaderboard(req.player.id));
}

export async function getProfile(req, res) {
  res.json(await profileSvc.profile(req.player));
}
