import { describe, expect, it } from 'vitest';
import { computeNeedScore } from './need';
import { makePlayer } from '../test/fixtures';
import type { RosterSlot } from '../domain/roster';

describe('computeNeedScore', () => {
  it('returns 1.0 when an exact-position slot is open', () => {
    const player = makePlayer({ id: 'RB1', position: ['RB'] });
    const slots: RosterSlot[] = [{ position: 'RB', count: 2, filled: 1 }];
    expect(computeNeedScore(player, slots)).toBe(1.0);
  });

  it('returns 0.5 when only a FLEX slot remains for a FLEX-eligible position', () => {
    const player = makePlayer({ id: 'RB1', position: ['RB'] });
    const slots: RosterSlot[] = [
      { position: 'RB', count: 2, filled: 2 },
      { position: 'FLEX', count: 1, filled: 0 },
    ];
    expect(computeNeedScore(player, slots)).toBe(0.5);
  });

  it('returns 0.0 when the roster is full at that position and no FLEX is open', () => {
    const player = makePlayer({ id: 'RB1', position: ['RB'] });
    const slots: RosterSlot[] = [
      { position: 'RB', count: 2, filled: 2 },
      { position: 'FLEX', count: 1, filled: 1 },
    ];
    expect(computeNeedScore(player, slots)).toBe(0.0);
  });

  it('returns 0.0 for a non-FLEX-eligible position with no open slot (e.g. K)', () => {
    const player = makePlayer({ id: 'K1', position: ['K'] });
    const slots: RosterSlot[] = [
      { position: 'K', count: 1, filled: 1 },
      { position: 'FLEX', count: 1, filled: 0 },
    ];
    expect(computeNeedScore(player, slots)).toBe(0.0);
  });

  it('returns 0.5 for a QB when only a SUPERFLEX slot remains', () => {
    const player = makePlayer({ id: 'QB1', position: ['QB'] });
    const slots: RosterSlot[] = [
      { position: 'QB', count: 1, filled: 1 },
      { position: 'SUPERFLEX', count: 1, filled: 0 },
    ];
    expect(computeNeedScore(player, slots)).toBe(0.5);
  });

  it('returns 0.5 for an IDP position (DB) when only IDP_FLEX remains', () => {
    const player = makePlayer({ id: 'DB1', position: ['DB'] });
    const slots: RosterSlot[] = [
      { position: 'DB', count: 1, filled: 1 },
      { position: 'IDP_FLEX', count: 1, filled: 0 },
    ];
    expect(computeNeedScore(player, slots)).toBe(0.5);
  });
});
