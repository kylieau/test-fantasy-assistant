import type { Player, Position } from '../domain/player';

/** A gap larger than this fraction of a position's top score starts a new tier. */
const TIER_GAP_FRACTION = 0.1;

/**
 * Static per-position tiering, computed once from a full player pool (not recomputed as
 * players are drafted, same reasoning as computePositionRanks). Within each position,
 * players are sorted by projected points and a new tier starts whenever the point gap to
 * the previous player exceeds TIER_GAP_FRACTION of that position's top score.
 */
export function computeTiers(players: Player[]): Record<string, number> {
  const byPosition = new Map<Position, Player[]>();

  for (const player of players) {
    const position = player.position[0];
    const list = byPosition.get(position);
    if (list) {
      list.push(player);
    } else {
      byPosition.set(position, [player]);
    }
  }

  const result: Record<string, number> = {};

  for (const list of byPosition.values()) {
    const sorted = [...list].sort((a, b) => b.projected_points - a.projected_points);
    if (sorted.length === 0) continue;

    const gapThreshold = sorted[0].projected_points * TIER_GAP_FRACTION;
    let tier = 1;
    result[sorted[0].id] = tier;

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i - 1].projected_points - sorted[i].projected_points;
      if (gap > gapThreshold) {
        tier += 1;
      }
      result[sorted[i].id] = tier;
    }
  }

  return result;
}
