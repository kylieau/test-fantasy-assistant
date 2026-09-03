import { describe, expect, it } from 'vitest';
import { computeAdpDelta, computeValue, labelAdpDelta } from './value';
import { makePlayer } from '../test/fixtures';

describe('value', () => {
  it('computes value as points above replacement for the primary position', () => {
    const player = makePlayer({ id: 'RB1', position: ['RB'], projected_points: 220 });
    expect(computeValue(player, { RB: 180 })).toBe(40);
  });

  it('treats a missing replacement level for the position as zero', () => {
    const player = makePlayer({ id: 'K1', position: ['K'], projected_points: 130 });
    expect(computeValue(player, {})).toBe(130);
  });

  it('computes adpDelta as adp minus rank', () => {
    const player = makePlayer({ id: 'WR1', adp: 40, rank: 24 });
    expect(computeAdpDelta(player)).toBe(16);
  });

  describe('labelAdpDelta', () => {
    it('labels a large positive delta as a steal', () => {
      expect(labelAdpDelta(16)).toBe('steal');
    });

    it('labels a large negative delta as a reach', () => {
      expect(labelAdpDelta(-16)).toBe('reach');
    });

    it('labels a small delta as neutral', () => {
      expect(labelAdpDelta(3)).toBe('neutral');
      expect(labelAdpDelta(-3)).toBe('neutral');
    });
  });
});
