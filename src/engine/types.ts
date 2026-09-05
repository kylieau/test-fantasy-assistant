import type { Player, Position } from '../domain/player';

export interface Recommendation {
  player: Player;
  value: number;
  adpDelta: number;
  needScore: number;
  score: number;
  reasonParts: string[];
  /** Team display name if this player has already been drafted; undefined while still available. */
  draftedBy?: string;
}

export type ReplacementLevels = Partial<Record<Position, number>>;
