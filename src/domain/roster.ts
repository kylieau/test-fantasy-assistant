import type { Player, Position } from './player';

export type RosterSlotType = Position | 'FLEX' | 'BENCH';

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
  return {
    teamCount,
    rosterSlots: DEFAULT_ROSTER_SLOTS.map((slot) => ({ ...slot })),
    scoring: { type: 'points' },
  };
}

export const FLEX_ELIGIBLE_POSITIONS: Position[] = ['RB', 'WR', 'TE'];

/**
 * Derives current slot fill counts from a drafted roster, rather than storing fill state
 * redundantly alongside the roster itself. Assigns each player (in roster order) to the
 * first open exact-position slot, falling back to FLEX then BENCH.
 */
export function computeFilledRosterSlots(templateSlots: RosterSlot[], roster: Player[]): RosterSlot[] {
  const slots = templateSlots.map((slot) => ({ ...slot, filled: 0 }));

  for (const player of roster) {
    const primaryPosition = player.position[0];
    const exactSlot = slots.find((s) => s.position === primaryPosition && s.filled < s.count);
    if (exactSlot) {
      exactSlot.filled += 1;
      continue;
    }

    if (FLEX_ELIGIBLE_POSITIONS.includes(primaryPosition)) {
      const flexSlot = slots.find((s) => s.position === 'FLEX' && s.filled < s.count);
      if (flexSlot) {
        flexSlot.filled += 1;
        continue;
      }
    }

    const benchSlot = slots.find((s) => s.position === 'BENCH' && s.filled < s.count);
    if (benchSlot) {
      benchSlot.filled += 1;
    }
  }

  return slots;
}
