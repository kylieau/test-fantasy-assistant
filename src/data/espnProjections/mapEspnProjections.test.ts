import { describe, expect, it } from 'vitest';
import { buildEspnProjectionIndex, nameAndPositionKey, normalizePlayerName, resolveDstTeam } from './mapEspnProjections';
import type { EspnRawPlayer } from './espnProjectionsTypes';

const SEASON = 2026;

// Modeled directly on the real ESPN payload captured during development.
function skillPlayer(overrides: Partial<EspnRawPlayer['player']> = {}): EspnRawPlayer {
  return {
    player: {
      id: 1,
      fullName: 'Jahmyr Gibbs',
      defaultPositionId: 2, // RB
      draftRanksByRankType: { PPR: { rank: 1 }, STANDARD: { rank: 1 } },
      ownership: { averageDraftPosition: 1.32 },
      stats: [
        { id: '102025', seasonId: 2025, scoringPeriodId: 0, statSourceId: 1, appliedTotal: 317.28 },
        { id: '102026', seasonId: 2026, scoringPeriodId: 0, statSourceId: 1, appliedTotal: 365.67 },
        { id: '002025', seasonId: 2025, scoringPeriodId: 0, statSourceId: 0, appliedTotal: 366.9 },
        { id: '11202613', seasonId: 2026, scoringPeriodId: 13, statSourceId: 1, appliedTotal: 21.97 },
      ],
      ...overrides,
    },
  };
}

function dstPlayer(fullName: string): EspnRawPlayer {
  return {
    player: {
      id: 100,
      fullName,
      defaultPositionId: 16,
      draftRanksByRankType: { PPR: { rank: 120 } },
      ownership: { averageDraftPosition: 130.5 },
      stats: [{ id: '102026', seasonId: 2026, scoringPeriodId: 0, statSourceId: 1, appliedTotal: 145.2 }],
    },
  };
}

describe('normalizePlayerName', () => {
  it('lowercases, strips punctuation and generational suffixes', () => {
    expect(normalizePlayerName("Ja'Marr Chase")).toBe('jamarr chase');
    expect(normalizePlayerName('Odell Beckham Jr.')).toBe('odell beckham');
    expect(normalizePlayerName('Michael Pittman III')).toBe('michael pittman');
  });
});

describe('resolveDstTeam', () => {
  it('resolves a known nickname', () => {
    expect(resolveDstTeam('Texans D/ST')).toBe('HOU');
    expect(resolveDstTeam('49ers D/ST')).toBe('SF');
  });

  it('returns null for an unrecognized nickname', () => {
    expect(resolveDstTeam('Nonexistent D/ST')).toBeNull();
  });
});

describe('buildEspnProjectionIndex', () => {
  it('indexes a skill player by normalized name + position using the current season projection', () => {
    const index = buildEspnProjectionIndex([skillPlayer()], SEASON);
    const entry = index.byNameAndPosition.get(nameAndPositionKey('Jahmyr Gibbs', 'RB'));

    expect(entry).toEqual({ adp: 1.32, rank: 1, projected_points: 365.67 });
  });

  it('indexes a D/ST by team rather than name', () => {
    const index = buildEspnProjectionIndex([dstPlayer('Texans D/ST')], SEASON);
    expect(index.byDstTeam.get('HOU')).toEqual({ adp: 130.5, rank: 120, projected_points: 145.2 });
  });

  it('skips a player missing a current-season projection entry', () => {
    const noProjection = skillPlayer({
      stats: [{ id: '102025', seasonId: 2025, scoringPeriodId: 0, statSourceId: 1, appliedTotal: 300 }],
    });
    const index = buildEspnProjectionIndex([noProjection], SEASON);
    expect(index.byNameAndPosition.size).toBe(0);
  });

  it('skips a player with an unmapped position id', () => {
    const idp = skillPlayer({ defaultPositionId: 9 }); // linebacker, not in our position set
    const index = buildEspnProjectionIndex([idp], SEASON);
    expect(index.byNameAndPosition.size).toBe(0);
  });

  it('skips a D/ST with an unresolvable nickname rather than mis-keying it', () => {
    const index = buildEspnProjectionIndex([dstPlayer('Nonexistent D/ST')], SEASON);
    expect(index.byDstTeam.size).toBe(0);
  });
});
