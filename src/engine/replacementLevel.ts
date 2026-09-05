import type { Player, Position } from '../domain/player';
import type { LeagueSettings, RosterSlotType } from '../domain/roster';
import { IDP_ELIGIBLE_POSITIONS } from '../domain/roster';
import type { ReplacementLevels } from './types';

const ALL_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'DL', 'LB', 'DB'];

/** FLEX slots only feed RB/WR replacement pools — a documented Phase-1 simplification. */
const FLEX_SHARE_POSITIONS: Position[] = ['RB', 'WR'];
/** In practice a superflex slot overwhelmingly ends up used on a second QB. */
const SUPERFLEX_SHARE_POSITIONS: Position[] = ['QB'];
/** IDP_FLEX slots split evenly across the three IDP positions, same treatment as FLEX/RB/WR. */
const IDP_FLEX_SHARE_POSITIONS: Position[] = IDP_ELIGIBLE_POSITIONS;

/** Which positions share credit for each flex-style slot type, and how many ways it's split. */
const FLEX_SHARE_BY_SLOT: Partial<Record<RosterSlotType, Position[]>> = {
  FLEX: FLEX_SHARE_POSITIONS,
  SUPERFLEX: SUPERFLEX_SHARE_POSITIONS,
  IDP_FLEX: IDP_FLEX_SHARE_POSITIONS,
};

/** Extra bench depth per team, as a multiplier of team count, per position. */
const BENCH_BUFFER_MULTIPLIER: Record<Position, number> = {
  QB: 0.3,
  RB: 1,
  WR: 1,
  TE: 0.3,
  K: 0,
  DST: 0,
  DL: 0.3,
  LB: 0.3,
  DB: 0.3,
};

function starterSlotsPerTeam(leagueSettings: LeagueSettings, position: Position): number {
  let slots = 0;
  for (const rosterSlot of leagueSettings.rosterSlots) {
    if (rosterSlot.position === position) {
      slots += rosterSlot.count;
      continue;
    }
    const sharePositions = FLEX_SHARE_BY_SLOT[rosterSlot.position];
    if (sharePositions?.includes(position)) {
      slots += rosterSlot.count / sharePositions.length;
    }
  }
  return slots;
}

export function replacementRank(leagueSettings: LeagueSettings, position: Position): number {
  const starters = leagueSettings.teamCount * starterSlotsPerTeam(leagueSettings, position);
  const benchBuffer = Math.round(leagueSettings.teamCount * BENCH_BUFFER_MULTIPLIER[position]);
  return Math.max(1, Math.round(starters) + benchBuffer);
}

/**
 * Replacement level per position, computed against the *currently available* player pool
 * so it drifts as players are drafted off the board.
 */
export function computeReplacementLevels(
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
): ReplacementLevels {
  const levels: ReplacementLevels = {};

  for (const position of ALL_POSITIONS) {
    const atPosition = availablePlayers
      .filter((p) => p.position.includes(position))
      .sort((a, b) => b.projected_points - a.projected_points);

    if (atPosition.length === 0) {
      continue;
    }

    const rank = replacementRank(leagueSettings, position);
    // Graceful degradation: if the position pool is nearly exhausted, fall back to the
    // lowest remaining player rather than throwing or going out of bounds.
    const index = Math.min(rank - 1, atPosition.length - 1);
    levels[position] = atPosition[index].projected_points;
  }

  return levels;
}
