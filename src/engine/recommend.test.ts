import { describe, expect, it } from 'vitest';
import { rankRecommendations } from './recommend';
import { sampleLeagueSettings, samplePlayers } from '../test/fixtures';
import type { RosterSlot } from '../domain/roster';

describe('rankRecommendations', () => {
  const leagueSettings = sampleLeagueSettings();
  const players = samplePlayers();
  // Roster with an open RB slot and a full WR (so need clearly favors RB over WR).
  const rosterSlots: RosterSlot[] = [
    { position: 'RB', count: 1, filled: 0 },
    { position: 'WR', count: 1, filled: 1 },
  ];

  it('at w=0 (pure BPA), ranks purely by value, ignoring need', () => {
    const recs = rankRecommendations(players, leagueSettings, rosterSlots, 0);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].value).toBeGreaterThanOrEqual(recs[i].value);
    }
  });

  it('at w=1 (pure need), ranks purely by needScore', () => {
    const recs = rankRecommendations(players, leagueSettings, rosterSlots, 1);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].needScore).toBeGreaterThanOrEqual(recs[i].needScore);
    }
  });

  it('generates non-empty reasoning for the top recommendation', () => {
    const recs = rankRecommendations(players, leagueSettings, rosterSlots, 0.3);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].reasonParts.length).toBeGreaterThan(0);
  });

  it('respects topN', () => {
    const recs = rankRecommendations(players, leagueSettings, rosterSlots, 0.3, 5);
    expect(recs).toHaveLength(5);
  });

  it('returns an empty array when no players are available', () => {
    expect(rankRecommendations([], leagueSettings, rosterSlots, 0.3)).toEqual([]);
  });
});
