import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SleeperAdapter } from './sleeperAdapter';
import * as sleeperClient from './sleeperClient';
import { createDefaultLeagueSettings } from '../../domain/roster';
import type { DraftState } from '../../domain/draft';
import type { SleeperPick, SleeperPlayer } from './sleeperTypes';

vi.mock('./sleeperClient', () => ({
  getDraftPicks: vi.fn(),
}));

function initialState(): DraftState {
  return {
    leagueSettings: { ...createDefaultLeagueSettings(2), platform: 'sleeper' },
    picksMade: [],
    availablePlayers: [
      { id: '1', name: 'Player One', position: ['RB'], team: 'BUF', sport: 'NFL', adp: 0, rank: 0, projected_points: 0 },
      { id: '2', name: 'Player Two', position: ['WR'], team: 'MIA', sport: 'NFL', adp: 0, rank: 0, projected_points: 0 },
    ],
    currentPick: 1,
    userTeamId: 'sleeper-roster-10',
    userRoster: [],
    opponentRosters: {},
    strategy: 'balanced',
    favoritedPlayerIds: [],
  };
}

const playersById: Record<string, SleeperPlayer> = {
  '1': { player_id: '1', full_name: 'Player One', position: 'RB', fantasy_positions: ['RB'], team: 'BUF' },
  '2': { player_id: '2', full_name: 'Player Two', position: 'WR', fantasy_positions: ['WR'], team: 'MIA' },
};

describe('SleeperAdapter.applyNewPicks', () => {
  it('dispatches new picks in pick_no order and no-ops on replay', () => {
    const adapter = new SleeperAdapter(initialState(), 'draft-1', playersById, vi.fn());
    const listener = vi.fn();
    adapter.subscribe(listener);

    const picks: SleeperPick[] = [
      { player_id: '2', picked_by: null, roster_id: 3, pick_no: 2, round: 1, draft_slot: 2, metadata: null },
      { player_id: '1', picked_by: null, roster_id: 10, pick_no: 1, round: 1, draft_slot: 1, metadata: null },
    ];

    adapter.applyNewPicks(picks);

    expect(adapter.getState().picksMade.map((p) => p.player.id)).toEqual(['1', '2']);
    expect(adapter.getState().userRoster.map((p) => p.id)).toEqual(['1']); // roster 10 = userTeamId
    expect(adapter.getState().opponentRosters['sleeper-roster-3']?.map((p) => p.id)).toEqual(['2']);
    expect(listener).toHaveBeenCalledTimes(2);

    // A real poll re-fetches the *full* pick list every time — replaying already-applied
    // picks must be a no-op, not a duplicate dispatch.
    adapter.applyNewPicks(picks);
    expect(adapter.getState().picksMade).toHaveLength(2);
  });

  it('skips a pick for an unmapped, metadata-less player without crashing', () => {
    const adapter = new SleeperAdapter(initialState(), 'draft-1', {}, vi.fn());
    const picks: SleeperPick[] = [
      { player_id: 'unknown', picked_by: null, roster_id: 10, pick_no: 1, round: 1, draft_slot: 1, metadata: null },
    ];

    expect(() => adapter.applyNewPicks(picks)).not.toThrow();
    expect(adapter.getState().picksMade).toHaveLength(0);
  });

  it('falls back to pick metadata when the player is not in the cached players map', () => {
    const adapter = new SleeperAdapter(initialState(), 'draft-1', {}, vi.fn());
    const picks: SleeperPick[] = [
      {
        player_id: '1',
        picked_by: null,
        roster_id: 10,
        pick_no: 1,
        round: 1,
        draft_slot: 1,
        metadata: { first_name: 'Player', last_name: 'One', position: 'RB', team: 'BUF' },
      },
    ];

    adapter.applyNewPicks(picks);
    expect(adapter.getState().userRoster.map((p) => p.id)).toEqual(['1']);
  });
});

describe('SleeperAdapter polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reports ok status and applies picks on a successful poll', async () => {
    const picks: SleeperPick[] = [
      { player_id: '1', picked_by: null, roster_id: 10, pick_no: 1, round: 1, draft_slot: 1, metadata: null },
    ];
    vi.mocked(sleeperClient.getDraftPicks).mockResolvedValue(picks);

    const onSyncStatusChange = vi.fn();
    const adapter = new SleeperAdapter(initialState(), 'draft-1', playersById, onSyncStatusChange);
    adapter.start();

    await vi.advanceTimersByTimeAsync(5000);

    expect(adapter.getState().picksMade).toHaveLength(1);
    expect(onSyncStatusChange).toHaveBeenCalledWith(expect.objectContaining({ state: 'ok' }));
    adapter.stop();
  });

  it('reports error status and stops polling after 3 consecutive failures', async () => {
    vi.mocked(sleeperClient.getDraftPicks).mockRejectedValue(new Error('network down'));

    const onSyncStatusChange = vi.fn();
    const adapter = new SleeperAdapter(initialState(), 'draft-1', playersById, onSyncStatusChange);
    adapter.start();

    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);

    expect(onSyncStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'error' }));

    const callsBeforeExtraWait = vi.mocked(sleeperClient.getDraftPicks).mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(vi.mocked(sleeperClient.getDraftPicks).mock.calls.length).toBe(callsBeforeExtraWait);
  });
});
