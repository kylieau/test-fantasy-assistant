import type { Player, Position } from '../domain/player';

/**
 * Static per-position rank (the "2" in "WR2"), computed once from a full player pool
 * sorted by overall `rank` — not recomputed as players are drafted, matching how
 * `rank`/`adp` are already static, preseason-style fields on Player.
 */
export function computePositionRanks(players: Player[]): Record<string, number> {
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
    const sorted = [...list].sort((a, b) => a.rank - b.rank);
    sorted.forEach((player, index) => {
      result[player.id] = index + 1;
    });
  }

  return result;
}
