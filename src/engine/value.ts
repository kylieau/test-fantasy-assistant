import type { Player } from '../domain/player';
import type { ReplacementLevels } from './types';

export const STEAL_THRESHOLD = 10;
export const REACH_THRESHOLD = -10;

export type AdpLabel = 'steal' | 'reach' | 'neutral';

/** Value over replacement (VBD), using the player's primary listed position. */
export function computeValue(player: Player, replacementLevels: ReplacementLevels): number {
  const primaryPosition = player.position[0];
  const replacementLevel = replacementLevels[primaryPosition] ?? 0;
  return player.projected_points - replacementLevel;
}

/** Positive => ranked better than ADP suggests (steal if drafted now); negative => reach. */
export function computeAdpDelta(player: Player): number {
  return player.adp - player.rank;
}

export function labelAdpDelta(adpDelta: number): AdpLabel {
  if (adpDelta > STEAL_THRESHOLD) return 'steal';
  if (adpDelta < REACH_THRESHOLD) return 'reach';
  return 'neutral';
}
