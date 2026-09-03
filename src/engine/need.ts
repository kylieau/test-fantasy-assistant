import type { Player } from '../domain/player';
import { FLEX_ELIGIBLE_POSITIONS, type RosterSlot } from '../domain/roster';

function hasOpenSlot(rosterSlots: RosterSlot[], position: RosterSlot['position']): boolean {
  return rosterSlots.some((slot) => slot.position === position && slot.filled < slot.count);
}

/**
 * 1.0 if an exact-position slot is open, 0.5 if only a FLEX-eligible slot remains,
 * 0.0 if the roster can't currently accept this position (bench overflow only).
 */
export function computeNeedScore(player: Player, rosterSlots: RosterSlot[]): number {
  const primaryPosition = player.position[0];

  if (hasOpenSlot(rosterSlots, primaryPosition)) {
    return 1.0;
  }

  if (FLEX_ELIGIBLE_POSITIONS.includes(primaryPosition) && hasOpenSlot(rosterSlots, 'FLEX')) {
    return 0.5;
  }

  return 0.0;
}
