import { describe, expect, it } from 'vitest';
import { computePositionRanks } from './positionRank';
import { makePlayer } from '../test/fixtures';

describe('computePositionRanks', () => {
  it('ranks players within a position by overall rank, independently per position', () => {
    const players = [
      makePlayer({ id: 'RB1', position: ['RB'], rank: 5 }),
      makePlayer({ id: 'RB2', position: ['RB'], rank: 1 }),
      makePlayer({ id: 'WR1', position: ['WR'], rank: 3 }),
      makePlayer({ id: 'WR2', position: ['WR'], rank: 2 }),
    ];

    const ranks = computePositionRanks(players);

    expect(ranks.RB2).toBe(1);
    expect(ranks.RB1).toBe(2);
    expect(ranks.WR2).toBe(1);
    expect(ranks.WR1).toBe(2);
  });

  it('handles an empty pool', () => {
    expect(computePositionRanks([])).toEqual({});
  });
});
