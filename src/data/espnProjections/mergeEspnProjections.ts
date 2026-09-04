import type { Player } from '../../domain/player';
import { nameAndPositionKey, type EspnProjectionIndex } from './mapEspnProjections';

export interface MergeResult {
  players: Player[];
  matchedFraction: number;
}

/**
 * Overwrites adp/rank/projected_points on players ESPN projects; leaves the sentinel zeros
 * on players it doesn't (rare deep-bench players — legitimately near-zero draft value too).
 */
export function mergeEspnProjections(players: Player[], index: EspnProjectionIndex): MergeResult {
  let matched = 0;

  const merged = players.map((player) => {
    const position = player.position[0];
    const entry =
      position === 'DST'
        ? index.byDstTeam.get(player.team)
        : index.byNameAndPosition.get(nameAndPositionKey(player.name, position));

    if (!entry) return player;

    matched += 1;
    return { ...player, adp: entry.adp, rank: entry.rank, projected_points: entry.projected_points };
  });

  return {
    players: merged,
    matchedFraction: players.length === 0 ? 0 : matched / players.length,
  };
}
