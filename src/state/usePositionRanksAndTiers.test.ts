import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePositionRanksAndTiers } from './usePositionRanksAndTiers';
import { createDefaultLeagueSettings } from '../domain/roster';
import { USER_TEAM_ID, type DraftState } from '../domain/draft';
import { makePlayer } from '../test/fixtures';
import { POSITION_RANKS } from '../data/seed/derived';

function sleeperState(overrides: Partial<DraftState> = {}): DraftState {
  return {
    leagueSettings: { ...createDefaultLeagueSettings(2), platform: 'sleeper', hasProjections: true },
    picksMade: [],
    availablePlayers: [],
    currentPick: 1,
    userTeamId: 'sleeper-roster-1',
    userRoster: [],
    opponentRosters: {},
    strategy: 'balanced',
    favoritedPlayerIds: [],
    ...overrides,
  };
}

describe('usePositionRanksAndTiers', () => {
  it('returns empty maps when there is no state', () => {
    const { result } = renderHook(() => usePositionRanksAndTiers(null));
    expect(result.current).toEqual({ positionRanks: {}, tiers: {} });
  });

  it('uses the precomputed seed-derived constants for manual mode', () => {
    const state: DraftState = {
      leagueSettings: createDefaultLeagueSettings(10),
      picksMade: [],
      availablePlayers: [],
      currentPick: 1,
      userTeamId: USER_TEAM_ID,
      userRoster: [],
      opponentRosters: {},
      strategy: 'balanced',
      favoritedPlayerIds: [],
    };
    const { result } = renderHook(() => usePositionRanksAndTiers(state));
    expect(result.current.positionRanks).toBe(POSITION_RANKS);
  });

  it('returns empty maps for Sleeper mode without usable projections', () => {
    const state = sleeperState({ leagueSettings: { ...sleeperState().leagueSettings, hasProjections: false } });
    const { result } = renderHook(() => usePositionRanksAndTiers(state));
    expect(result.current).toEqual({ positionRanks: {}, tiers: {} });
  });

  it('computes ranks/tiers from the full pool (available + drafted) for Sleeper with projections', () => {
    const rb1 = makePlayer({ id: 'a', name: 'A', position: ['RB'], rank: 1, projected_points: 300 });
    const rb2 = makePlayer({ id: 'b', name: 'B', position: ['RB'], rank: 2, projected_points: 250 });
    const state = sleeperState({
      availablePlayers: [rb2],
      userRoster: [rb1], // already drafted — must still count toward position rank
    });

    const { result } = renderHook(() => usePositionRanksAndTiers(state));

    expect(result.current.positionRanks).toEqual({ a: 1, b: 2 });
  });

  it('stays stable regardless of how many players have been drafted (recomputed from the same union)', () => {
    const rb1 = makePlayer({ id: 'a', name: 'A', position: ['RB'], rank: 1, projected_points: 300 });
    const rb2 = makePlayer({ id: 'b', name: 'B', position: ['RB'], rank: 2, projected_points: 250 });

    const beforeDraft = sleeperState({ availablePlayers: [rb1, rb2] });
    const afterDraft = sleeperState({ availablePlayers: [rb2], userRoster: [rb1] });

    const before = renderHook(() => usePositionRanksAndTiers(beforeDraft)).result.current;
    const after = renderHook(() => usePositionRanksAndTiers(afterDraft)).result.current;

    expect(before.positionRanks).toEqual(after.positionRanks);
  });
});
