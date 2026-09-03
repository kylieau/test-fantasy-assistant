export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export interface Player {
  id: string;
  name: string;
  /** Multi-position eligibility support (kept as an array even though NFL is single-position today). */
  position: Position[];
  team: string;
  sport: 'NFL';
  bye_week?: number;
  adp: number;
  rank: number;
  projected_points: number;
}
