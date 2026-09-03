import { describe, expect, it, vi } from 'vitest';
import { ManualAdapter } from './manualAdapter';
import { createDefaultLeagueSettings } from '../../domain/roster';
import { USER_TEAM_ID, type DraftState } from '../../domain/draft';
import { samplePlayers } from '../../test/fixtures';

function initialState(): DraftState {
  return {
    leagueSettings: createDefaultLeagueSettings(4),
    picksMade: [],
    availablePlayers: samplePlayers(),
    currentPick: 1,
    userTeamId: USER_TEAM_ID,
    userRoster: [],
    opponentRosters: {},
    bpaVsNeedWeight: 0.3,
  };
}

describe('ManualAdapter', () => {
  it('exposes league settings and available players', () => {
    const adapter = new ManualAdapter(initialState());
    expect(adapter.getLeagueSettings().teamCount).toBe(4);
    expect(adapter.getAvailablePlayers().length).toBeGreaterThan(0);
  });

  it('markDrafted updates state and notifies subscribers', () => {
    const adapter = new ManualAdapter(initialState());
    const listener = vi.fn();
    adapter.subscribe(listener);

    adapter.markDrafted('RB1', USER_TEAM_ID);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getState().userRoster.map((p) => p.id)).toEqual(['RB1']);
    expect(adapter.getAvailablePlayers().some((p) => p.id === 'RB1')).toBe(false);
  });

  it('undoLastPick reverses the pick and notifies subscribers again', () => {
    const adapter = new ManualAdapter(initialState());
    adapter.markDrafted('RB1', USER_TEAM_ID);
    const listener = vi.fn();
    adapter.subscribe(listener);

    adapter.undoLastPick();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getState().userRoster).toHaveLength(0);
  });

  it('unsubscribe stops further notifications', () => {
    const adapter = new ManualAdapter(initialState());
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    unsubscribe();

    adapter.markDrafted('RB1', USER_TEAM_ID);

    expect(listener).not.toHaveBeenCalled();
  });
});
