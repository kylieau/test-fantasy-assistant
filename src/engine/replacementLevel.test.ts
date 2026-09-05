import { describe, expect, it } from 'vitest';
import { computeReplacementLevels, replacementRank } from './replacementLevel';
import { sampleLeagueSettings, samplePlayers } from '../test/fixtures';

describe('replacementLevel', () => {
  it('computes an in-bounds replacement rank for QB (4 teams, 1 starter + bench buffer)', () => {
    const leagueSettings = sampleLeagueSettings();
    expect(replacementRank(leagueSettings, 'QB')).toBe(5);

    const levels = computeReplacementLevels(samplePlayers(), leagueSettings);
    // 5th-ranked QB by projected_points in the fixture (220,210,200,190,180,...) is 180.
    expect(levels.QB).toBe(180);
  });

  it('degrades gracefully to the lowest remaining player when a position pool is nearly exhausted', () => {
    const leagueSettings = sampleLeagueSettings();
    // Rank formula wants the 14th-best RB, but the fixture only has 10 RBs available.
    expect(replacementRank(leagueSettings, 'RB')).toBe(14);

    const levels = computeReplacementLevels(samplePlayers(), leagueSettings);
    expect(levels.RB).toBe(100); // the worst of the 10 available RBs, not a crash/undefined
  });

  it('recomputes against only currently-available players', () => {
    const leagueSettings = sampleLeagueSettings();
    const players = samplePlayers().filter((p) => p.id !== 'QB1' && p.id !== 'QB2');
    const levels = computeReplacementLevels(players, leagueSettings);
    // With the top two QBs drafted off the board, the 5th-best remaining QB is now 170 (was 180).
    expect(levels.QB).toBe(170);
  });

  it('credits a SUPERFLEX slot entirely to QB starter demand', () => {
    const base = sampleLeagueSettings();
    const withSuperflex = {
      ...base,
      rosterSlots: [...base.rosterSlots, { position: 'SUPERFLEX' as const, count: 1, filled: 0 }],
    };
    // Baseline (no superflex) is 5 (see the first test above); one superflex slot per team
    // doubles QB starter demand from 1 to 2 per team, so rank climbs from 5 to 9.
    expect(replacementRank(withSuperflex, 'QB')).toBe(9);
  });

  it('splits an IDP_FLEX slot evenly across DL/LB/DB starter demand', () => {
    const base = sampleLeagueSettings();
    const withIdpFlex = {
      ...base,
      rosterSlots: [...base.rosterSlots, { position: 'IDP_FLEX' as const, count: 3, filled: 0 }],
    };
    // 4 teams * (3 IDP_FLEX slots / 3 IDP positions) = 4 starters, plus the 0.3x bench buffer.
    expect(replacementRank(withIdpFlex, 'DL')).toBe(5);
  });
});
