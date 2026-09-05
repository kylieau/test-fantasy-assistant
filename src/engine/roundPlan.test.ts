import { describe, expect, it } from 'vitest';
import { summarizeRoundNeed } from './roundPlan';
import type { RosterSlot } from '../domain/roster';

function slot(position: RosterSlot['position'], count: number, filled: number): RosterSlot {
  return { position, count, filled };
}

describe('summarizeRoundNeed', () => {
  it('names the starter position with the biggest open gap', () => {
    const slots = [slot('QB', 1, 1), slot('RB', 2, 0), slot('WR', 2, 2), slot('BENCH', 6, 0)];
    expect(summarizeRoundNeed(slots)).toBe('Upside RB');
  });

  it('lists up to two neediest positions, largest gap first', () => {
    const slots = [slot('QB', 1, 0), slot('RB', 2, 0), slot('WR', 2, 1), slot('BENCH', 6, 0)];
    expect(summarizeRoundNeed(slots)).toBe('Upside RB / QB');
  });

  it('ignores BENCH gaps entirely', () => {
    const slots = [slot('QB', 1, 1), slot('RB', 2, 2), slot('BENCH', 6, 0)];
    expect(summarizeRoundNeed(slots)).toBe('Best Player Available');
  });

  it('falls back to Best Player Available once all starter slots are full', () => {
    const slots = [slot('QB', 1, 1), slot('RB', 2, 2), slot('WR', 2, 2)];
    expect(summarizeRoundNeed(slots)).toBe('Best Player Available');
  });
});
