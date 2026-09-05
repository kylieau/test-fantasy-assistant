import type { RosterSlot } from '../domain/roster';

const FALLBACK_LABEL = 'Best Player Available';
const MAX_POSITIONS_IN_LABEL = 2;

/**
 * Short auto-generated plan label for a future round (e.g. "Upside RB / WR"), derived from
 * which starter slots are least filled at that point in the simulated draft. BENCH is
 * excluded — bench depth isn't a "plan," it's just taking the best player left.
 */
export function summarizeRoundNeed(rosterSlots: RosterSlot[]): string {
  const starterGaps = rosterSlots
    .filter((slot) => slot.position !== 'BENCH')
    .map((slot) => ({ position: slot.position, gap: slot.count - slot.filled }))
    .filter((slot) => slot.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  if (starterGaps.length === 0) return FALLBACK_LABEL;

  const positions = starterGaps.slice(0, MAX_POSITIONS_IN_LABEL).map((s) => s.position);
  return `Upside ${positions.join(' / ')}`;
}
