import { describe, expect, it } from 'vitest';
import { currentFantasySeason } from './espnProjectionsClient';

describe('currentFantasySeason', () => {
  it('uses the current year once the season has rolled over (March onward)', () => {
    expect(currentFantasySeason(new Date('2026-09-04'))).toBe(2026);
    expect(currentFantasySeason(new Date('2026-03-01'))).toBe(2026);
  });

  it('uses the previous year before the rollover (Jan/Feb)', () => {
    expect(currentFantasySeason(new Date('2026-01-15'))).toBe(2025);
    expect(currentFantasySeason(new Date('2026-02-28'))).toBe(2025);
  });
});
