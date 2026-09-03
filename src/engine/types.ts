import type { Player, Position } from '../domain/player';

export interface Recommendation {
  player: Player;
  value: number;
  adpDelta: number;
  needScore: number;
  score: number;
  reasonParts: string[];
}

export type ReplacementLevels = Partial<Record<Position, number>>;
