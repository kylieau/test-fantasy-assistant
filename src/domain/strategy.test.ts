import { describe, expect, it } from 'vitest';
import { resolveStrategyWeight, rosterFillFraction } from './strategy';
import type { RosterSlot } from './roster';

const halfFullSlots: RosterSlot[] = [
  { position: 'RB', count: 2, filled: 1 },
  { position: 'WR', count: 2, filled: 1 },
];

const mostlyFullSlots: RosterSlot[] = [
  { position: 'RB', count: 2, filled: 2 },
  { position: 'WR', count: 2, filled: 2 },
  { position: 'BENCH', count: 6, filled: 4 },
];

describe('rosterFillFraction', () => {
  it('computes filled/total across all slots', () => {
    expect(rosterFillFraction(halfFullSlots)).toBe(0.5);
  });

  it('returns 0 when there are no slots', () => {
    expect(rosterFillFraction([])).toBe(0);
  });
});

describe('resolveStrategyWeight', () => {
  it('bpa is always weight 0', () => {
    expect(resolveStrategyWeight('bpa', mostlyFullSlots)).toBe(0);
  });

  it('need is always weight 1', () => {
    expect(resolveStrategyWeight('need', halfFullSlots)).toBe(1);
  });

  it('balanced is always weight 0.5', () => {
    expect(resolveStrategyWeight('balanced', halfFullSlots)).toBe(0.5);
  });

  it('bpa_then_need_80 is weight 0 below the 80% fill threshold', () => {
    expect(resolveStrategyWeight('bpa_then_need_80', halfFullSlots)).toBe(0);
  });

  it('bpa_then_need_80 is weight 1 at or above the 80% fill threshold', () => {
    // 8 filled / 10 total = exactly 80%.
    expect(rosterFillFraction(mostlyFullSlots)).toBe(0.8);
    expect(resolveStrategyWeight('bpa_then_need_80', mostlyFullSlots)).toBe(1);
  });
});
