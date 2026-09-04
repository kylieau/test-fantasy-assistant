import type { Player, Position } from './player';

export type RosterSlotType = Position | 'FLEX' | 'BENCH';
export type DraftType = 'snake' | 'linear';
export type DraftPlatform = 'manual' | 'sleeper';

export interface RosterSlot {
  position: RosterSlotType;
  count: number;
  filled: number;
}

export interface LeagueSettings {
  teamCount: number;
  /** Template slots per team, before any draft picks are made. */
  rosterSlots: RosterSlot[];
  scoring: { type: 'points' };
  draftType: DraftType;
  /** Team ids in round-1 pick order (length === teamCount). */
  draftOrder: string[];
  /** Display name per team id. */
  teamNames: Record<string, string>;
  /** Which draft adapter is live. Sleeper stays authoritative for actual picks regardless
   * of hasProjections — the UI hides draft actions (not recommendations) when this isn't
   * 'manual', matching a "decide here, execute there" workflow. */
  platform: DraftPlatform;
  /**
   * Whether availablePlayers carry real, usable adp/rank/projected_points. True for manual
   * (seed data). For Sleeper, true only once real projections have been merged in from
   * elsewhere (see src/data/espnProjections) — false means the recommendation engine would
   * only see sentinel zeros, so the UI shows a tracker-only view instead of fake rankings.
   */
  hasProjections: boolean;
}

export const DEFAULT_ROSTER_SLOTS: RosterSlot[] = [
  { position: 'QB', count: 1, filled: 0 },
  { position: 'RB', count: 2, filled: 0 },
  { position: 'WR', count: 2, filled: 0 },
  { position: 'TE', count: 1, filled: 0 },
  { position: 'FLEX', count: 1, filled: 0 },
  { position: 'K', count: 1, filled: 0 },
  { position: 'DST', count: 1, filled: 0 },
  { position: 'BENCH', count: 6, filled: 0 },
];

export function createDefaultLeagueSettings(teamCount = 10): LeagueSettings {
  const draftOrder = Array.from({ length: teamCount }, (_, i) => (i === 0 ? 'user' : `opp-${i}`));
  const teamNames: Record<string, string> = Object.fromEntries(
    draftOrder.map((id, i) => [id, i === 0 ? 'Me' : `Team ${i + 1}`]),
  );

  return {
    teamCount,
    rosterSlots: DEFAULT_ROSTER_SLOTS.map((slot) => ({ ...slot })),
    scoring: { type: 'points' },
    draftType: 'snake',
    draftOrder,
    teamNames,
    platform: 'manual',
    hasProjections: true,
  };
}

export const FLEX_ELIGIBLE_POSITIONS: Position[] = ['RB', 'WR', 'TE'];

export interface SlotAssignment extends RosterSlot {
  players: Player[];
}

function assignPlayersToSlots(templateSlots: RosterSlot[], roster: Player[]): SlotAssignment[] {
  const slots: SlotAssignment[] = templateSlots.map((slot) => ({ ...slot, filled: 0, players: [] }));

  for (const player of roster) {
    const primaryPosition = player.position[0];
    const exactSlot = slots.find((s) => s.position === primaryPosition && s.filled < s.count);
    if (exactSlot) {
      exactSlot.filled += 1;
      exactSlot.players.push(player);
      continue;
    }

    if (FLEX_ELIGIBLE_POSITIONS.includes(primaryPosition)) {
      const flexSlot = slots.find((s) => s.position === 'FLEX' && s.filled < s.count);
      if (flexSlot) {
        flexSlot.filled += 1;
        flexSlot.players.push(player);
        continue;
      }
    }

    const benchSlot = slots.find((s) => s.position === 'BENCH' && s.filled < s.count);
    if (benchSlot) {
      benchSlot.filled += 1;
      benchSlot.players.push(player);
    }
  }

  return slots;
}

/**
 * Derives current slot fill counts from a drafted roster, rather than storing fill state
 * redundantly alongside the roster itself. Assigns each player (in roster order) to the
 * first open exact-position slot, falling back to FLEX then BENCH.
 */
export function computeFilledRosterSlots(templateSlots: RosterSlot[], roster: Player[]): RosterSlot[] {
  return assignPlayersToSlots(templateSlots, roster).map(({ position, count, filled }) => ({
    position,
    count,
    filled,
  }));
}

/** Same assignment as computeFilledRosterSlots, but also returns which players landed in each slot. */
export function groupRosterBySlot(templateSlots: RosterSlot[], roster: Player[]): SlotAssignment[] {
  return assignPlayersToSlots(templateSlots, roster);
}

/** Resolves which team id is on the clock at a given overall pick number. */
export function pickOrderTeamId(leagueSettings: LeagueSettings, pickNumber: number): string {
  const { teamCount, draftOrder, draftType } = leagueSettings;
  const zeroBasedPick = pickNumber - 1;
  const round = Math.floor(zeroBasedPick / teamCount);
  const indexInRound = zeroBasedPick % teamCount;
  const isReversedRound = draftType === 'snake' && round % 2 === 1;
  const orderIndex = isReversedRound ? teamCount - 1 - indexInRound : indexInRound;
  return draftOrder[orderIndex];
}
