import { describe, expect, it } from 'vitest';
import { mergeEspnProjections } from './mergeEspnProjections';
import { buildEspnProjectionIndex } from './mapEspnProjections';
import type { EspnRawPlayer } from './espnProjectionsTypes';
import { makePlayer } from '../../test/fixtures';

const SEASON = 2026;

function espnSkillPlayer(fullName: string, positionId: number, adp: number, rank: number, points: number): EspnRawPlayer {
  return {
    player: {
      id: 1,
      fullName,
      defaultPositionId: positionId,
      draftRanksByRankType: { PPR: { rank } },
      ownership: { averageDraftPosition: adp },
      stats: [{ id: `10${SEASON}`, seasonId: SEASON, scoringPeriodId: 0, statSourceId: 1, appliedTotal: points }],
    },
  };
}

describe('mergeEspnProjections', () => {
  it('overwrites adp/rank/projected_points on a matched player', () => {
    const index = buildEspnProjectionIndex([espnSkillPlayer('Josh Allen', 1, 4.5, 3, 380.2)], SEASON);
    const sleeperPlayer = makePlayer({
      id: 'sleeper-1',
      name: 'Josh Allen',
      position: ['QB'],
      adp: 0,
      rank: 0,
      projected_points: 0,
    });

    const { players, matchedFraction } = mergeEspnProjections([sleeperPlayer], index);

    expect(players[0]).toMatchObject({ id: 'sleeper-1', adp: 4.5, rank: 3, projected_points: 380.2 });
    expect(matchedFraction).toBe(1);
  });

  it('leaves an unmatched player untouched (sentinel zeros stay)', () => {
    const index = buildEspnProjectionIndex([espnSkillPlayer('Josh Allen', 1, 4.5, 3, 380.2)], SEASON);
    const deepBenchGuy = makePlayer({ id: 'sleeper-2', name: 'Some Deep Bench Guy', position: ['WR'] });

    const { players, matchedFraction } = mergeEspnProjections([deepBenchGuy], index);

    expect(players[0]).toEqual(deepBenchGuy);
    expect(matchedFraction).toBe(0);
  });

  it('does not cross-match the same name at a different position', () => {
    const index = buildEspnProjectionIndex([espnSkillPlayer('Josh Allen', 1, 4.5, 3, 380.2)], SEASON); // QB
    const wrongPosition = makePlayer({ id: 'sleeper-3', name: 'Josh Allen', position: ['TE'] });

    const { players, matchedFraction } = mergeEspnProjections([wrongPosition], index);

    expect(players[0].projected_points).toBe(100); // fixture default, untouched
    expect(matchedFraction).toBe(0);
  });

  it('matches a D/ST by team rather than name', () => {
    const index = buildEspnProjectionIndex(
      [
        {
          player: {
            id: 100,
            fullName: 'Texans D/ST',
            defaultPositionId: 16,
            draftRanksByRankType: { PPR: { rank: 120 } },
            ownership: { averageDraftPosition: 130.5 },
            stats: [{ id: `10${SEASON}`, seasonId: SEASON, scoringPeriodId: 0, statSourceId: 1, appliedTotal: 145.2 }],
          },
        },
      ],
      SEASON,
    );
    const sleeperDst = makePlayer({ id: 'HOU', name: 'Houston Texans', position: ['DST'], team: 'HOU' });

    const { players } = mergeEspnProjections([sleeperDst], index);

    expect(players[0]).toMatchObject({ adp: 130.5, rank: 120, projected_points: 145.2 });
  });

  it('computes matchedFraction across a mixed pool', () => {
    const index = buildEspnProjectionIndex([espnSkillPlayer('Josh Allen', 1, 4.5, 3, 380.2)], SEASON);
    const players = [
      makePlayer({ id: '1', name: 'Josh Allen', position: ['QB'] }),
      makePlayer({ id: '2', name: 'Nobody Special', position: ['WR'] }),
    ];

    const { matchedFraction } = mergeEspnProjections(players, index);
    expect(matchedFraction).toBe(0.5);
  });

  it('returns 0 matchedFraction for an empty pool without dividing by zero', () => {
    const index = buildEspnProjectionIndex([], SEASON);
    expect(mergeEspnProjections([], index).matchedFraction).toBe(0);
  });
});
