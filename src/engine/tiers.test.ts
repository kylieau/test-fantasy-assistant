import { describe, expect, it } from 'vitest';
import { computeTiers } from './tiers';
import { makePlayer } from '../test/fixtures';

describe('computeTiers', () => {
  it('keeps players in the same tier when points are close together', () => {
    const players = [
      makePlayer({ id: 'RB1', position: ['RB'], projected_points: 300 }),
      makePlayer({ id: 'RB2', position: ['RB'], projected_points: 295 }),
      makePlayer({ id: 'RB3', position: ['RB'], projected_points: 290 }),
    ];
    const tiers = computeTiers(players);
    expect(tiers.RB1).toBe(1);
    expect(tiers.RB2).toBe(1);
    expect(tiers.RB3).toBe(1);
  });

  it('starts a new tier after a large point gap', () => {
    // Top score 300, threshold gap = 30. A 50pt drop should start tier 2.
    const players = [
      makePlayer({ id: 'RB1', position: ['RB'], projected_points: 300 }),
      makePlayer({ id: 'RB2', position: ['RB'], projected_points: 250 }),
      makePlayer({ id: 'RB3', position: ['RB'], projected_points: 245 }),
    ];
    const tiers = computeTiers(players);
    expect(tiers.RB1).toBe(1);
    expect(tiers.RB2).toBe(2);
    expect(tiers.RB3).toBe(2);
  });

  it('tiers each position independently', () => {
    const players = [
      makePlayer({ id: 'RB1', position: ['RB'], projected_points: 300 }),
      makePlayer({ id: 'RB2', position: ['RB'], projected_points: 100 }),
      makePlayer({ id: 'WR1', position: ['WR'], projected_points: 200 }),
      makePlayer({ id: 'WR2', position: ['WR'], projected_points: 195 }),
    ];
    const tiers = computeTiers(players);
    expect(tiers.RB1).toBe(1);
    expect(tiers.RB2).toBe(2);
    expect(tiers.WR1).toBe(1);
    expect(tiers.WR2).toBe(1);
  });

  it('handles an empty pool', () => {
    expect(computeTiers([])).toEqual({});
  });
});
