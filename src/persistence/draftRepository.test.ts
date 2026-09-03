import { beforeEach, describe, expect, it } from 'vitest';
import { clearDraftState, loadDraftState, saveDraftState } from './draftRepository';
import { createDefaultLeagueSettings } from '../domain/roster';
import type { DraftState } from '../domain/draft';
import { USER_TEAM_ID } from '../domain/draft';

function emptyDraftState(): DraftState {
  return {
    leagueSettings: createDefaultLeagueSettings(4),
    picksMade: [],
    availablePlayers: [],
    currentPick: 1,
    userTeamId: USER_TEAM_ID,
    userRoster: [],
    opponentRosters: {},
    bpaVsNeedWeight: 0.3,
  };
}

describe('draftRepository', () => {
  beforeEach(async () => {
    await clearDraftState();
  });

  it('returns undefined when nothing has been saved', async () => {
    expect(await loadDraftState()).toBeUndefined();
  });

  it('round-trips a saved draft state', async () => {
    const state = emptyDraftState();
    state.currentPick = 7;
    await saveDraftState(state);

    const loaded = await loadDraftState();
    expect(loaded?.currentPick).toBe(7);
    expect(loaded?.leagueSettings.teamCount).toBe(4);
  });

  it('clears the saved draft state', async () => {
    await saveDraftState(emptyDraftState());
    await clearDraftState();
    expect(await loadDraftState()).toBeUndefined();
  });
});
