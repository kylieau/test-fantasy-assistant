import type { Position } from '../domain/player';

/** One distinct color per position, used for the position badge shown next to each player. */
export const POSITION_COLORS: Record<Position, string> = {
  QB: '#8e44ad',
  RB: '#1d6f42',
  WR: '#1f6feb',
  TE: '#c0392b',
  K: '#b8860b',
  DST: '#546e7a',
};
