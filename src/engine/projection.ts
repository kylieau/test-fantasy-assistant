import type { Player } from '../domain/player';
import type { LeagueSettings } from '../domain/roster';
import { computeFilledRosterSlots, pickOrderTeamId } from '../domain/roster';
import { resolveStrategyWeight, type DraftStrategy } from '../domain/strategy';
import { rankRecommendations } from './recommend';

/** Total roster slots on a team, used to bound how many future rounds are worth projecting. */
export function totalRosterSlotCount(leagueSettings: LeagueSettings): number {
  return leagueSettings.rosterSlots.reduce((sum, slot) => sum + slot.count, 0);
}

/** The next `count` pick numbers (from currentPick onward) belonging to userTeamId. */
export function upcomingUserPickNumbers(
  leagueSettings: LeagueSettings,
  currentPick: number,
  userTeamId: string,
  count: number,
): number[] {
  const picks: number[] = [];
  // Every team picks exactly once per round, so the user's team must reappear at least
  // once every `teamCount` picks — this bound is generous padding against off-by-ones.
  const hardCap = currentPick + leagueSettings.teamCount * (count + 5);

  for (let pick = currentPick; picks.length < count && pick <= hardCap; pick++) {
    if (pickOrderTeamId(leagueSettings, pick) === userTeamId) {
      picks.push(pick);
    }
  }

  return picks;
}

/** Positive => ADP suggests the player should still be there at that pick; negative => likely gone. */
export function availabilityMargin(player: Player, nextUserPickNumber: number): number {
  return player.adp - nextUserPickNumber;
}

/**
 * How many picks of ADP margin correspond to one "swing" in availability odds. Real ADP has
 * variance rather than a hard cutoff, so this converts the linear margin into a smooth
 * probability via a logistic curve instead of a deterministic yes/no.
 */
const AVAILABILITY_SCALE = 6;

/** Rough probability (0–1) the player is still available at nextUserPickNumber, based on ADP. */
export function availabilityProbability(player: Player, nextUserPickNumber: number): number {
  const margin = availabilityMargin(player, nextUserPickNumber);
  return 1 / (1 + Math.exp(-margin / AVAILABILITY_SCALE));
}

export interface FuturePickProjection {
  pickNumber: number;
  round: number;
  player: Player;
  reasonParts: string[];
}

/**
 * Simulates the draft forward from currentPick to project a likely pick at each of the
 * user's next `numPicks` turns. Explicit simplifying assumption: every other team drafts
 * strictly by best-ADP-available between now and each projected turn — this is a
 * deliberately lightweight stand-in for full opponent modeling, not a guarantee.
 */
export function projectFuturePicks(
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
  userRoster: Player[],
  strategy: DraftStrategy,
  currentPick: number,
  userTeamId: string,
  numPicks: number,
): FuturePickProjection[] {
  const targetPicks = upcomingUserPickNumbers(leagueSettings, currentPick, userTeamId, numPicks);
  if (targetPicks.length === 0) return [];

  const targetPickSet = new Set(targetPicks);
  const lastTarget = targetPicks[targetPicks.length - 1];

  const pool = [...availablePlayers];
  const simulatedUserPicks: Player[] = [];
  const results: FuturePickProjection[] = [];

  for (let pick = currentPick; pick <= lastTarget; pick++) {
    if (targetPickSet.has(pick)) {
      const rosterSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, [
        ...userRoster,
        ...simulatedUserPicks,
      ]);
      const weight = resolveStrategyWeight(strategy, rosterSlots);
      const [top] = rankRecommendations(pool, leagueSettings, rosterSlots, weight, 1);
      if (!top) break;

      results.push({
        pickNumber: pick,
        round: Math.floor((pick - 1) / leagueSettings.teamCount) + 1,
        player: top.player,
        reasonParts: top.reasonParts,
      });

      simulatedUserPicks.push(top.player);
      const draftedIndex = pool.findIndex((p) => p.id === top.player.id);
      if (draftedIndex >= 0) pool.splice(draftedIndex, 1);
    } else if (pool.length > 0) {
      let bestAdpIndex = 0;
      for (let i = 1; i < pool.length; i++) {
        if (pool[i].adp < pool[bestAdpIndex].adp) bestAdpIndex = i;
      }
      pool.splice(bestAdpIndex, 1);
    }
  }

  return results;
}

/**
 * Same simplifying assumption as projectFuturePicks (opponents draft by best-ADP-available,
 * the user's own simulated picks follow their chosen strategy) but run forward to a single
 * target pick and reporting every plausible survivor there, rather than one guess per future
 * user turn. Backs "likely still there at your pick #N" — a shortlist, not a single guess.
 */
export function playersLikelyAvailableAt(
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
  userRoster: Player[],
  strategy: DraftStrategy,
  currentPick: number,
  userTeamId: string,
  targetPickNumber: number,
  topN: number,
): Player[] {
  const pool = [...availablePlayers];
  const simulatedUserPicks: Player[] = [];

  for (let pick = currentPick; pick < targetPickNumber && pool.length > 0; pick++) {
    if (pickOrderTeamId(leagueSettings, pick) === userTeamId) {
      const rosterSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, [
        ...userRoster,
        ...simulatedUserPicks,
      ]);
      const weight = resolveStrategyWeight(strategy, rosterSlots);
      const [top] = rankRecommendations(pool, leagueSettings, rosterSlots, weight, 1);
      if (!top) break;
      simulatedUserPicks.push(top.player);
      pool.splice(
        pool.findIndex((p) => p.id === top.player.id),
        1,
      );
    } else {
      let bestAdpIndex = 0;
      for (let i = 1; i < pool.length; i++) {
        if (pool[i].adp < pool[bestAdpIndex].adp) bestAdpIndex = i;
      }
      pool.splice(bestAdpIndex, 1);
    }
  }

  return [...pool].sort((a, b) => a.rank - b.rank).slice(0, topN);
}
