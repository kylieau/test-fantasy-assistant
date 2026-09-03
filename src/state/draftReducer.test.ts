import { describe, expect, it } from 'vitest';
import { draftReducer } from './draftReducer';
import { createDefaultLeagueSettings } from '../domain/roster';
import { USER_TEAM_ID, type DraftState } from '../domain/draft';
import { samplePlayers } from '../test/fixtures';

// availablePlayers is an unordered pool — undo restores the same set of players but
// appends the returned player at the end rather than its original index, since order
// carries no meaning (the UI and engine both re-sort/re-derive from it as needed).
function availablePlayerIds(state: DraftState): string[] {
  return state.availablePlayers.map((p) => p.id).sort();
}

function initialState(): DraftState {
  return draftReducer(
    {} as DraftState,
    {
      type: 'INIT_LEAGUE',
      leagueSettings: createDefaultLeagueSettings(4),
      availablePlayers: samplePlayers(),
      userTeamId: USER_TEAM_ID,
    },
  );
}

describe('draftReducer', () => {
  it('drafting a player for the user moves them from availablePlayers into userRoster', () => {
    const state = initialState();
    const next = draftReducer(state, { type: 'DRAFT_PLAYER', playerId: 'RB1', teamId: USER_TEAM_ID });

    expect(next.userRoster.map((p) => p.id)).toEqual(['RB1']);
    expect(next.availablePlayers.some((p) => p.id === 'RB1')).toBe(false);
    expect(next.currentPick).toBe(state.currentPick + 1);
    expect(next.picksMade).toHaveLength(1);
  });

  it('drafting a player for an opponent moves them into that opponent roster', () => {
    const state = initialState();
    const next = draftReducer(state, { type: 'DRAFT_PLAYER', playerId: 'WR1', teamId: 'opp-1' });

    expect(next.opponentRosters['opp-1'].map((p) => p.id)).toEqual(['WR1']);
    expect(next.userRoster).toHaveLength(0);
  });

  it('undo reverses the most recent pick, restoring equivalent prior state', () => {
    const state = initialState();
    const afterDraft = draftReducer(state, { type: 'DRAFT_PLAYER', playerId: 'QB1', teamId: USER_TEAM_ID });
    const afterUndo = draftReducer(afterDraft, { type: 'UNDO' });

    expect(availablePlayerIds(afterUndo)).toEqual(availablePlayerIds(state));
    expect({ ...afterUndo, availablePlayers: [] }).toEqual({ ...state, availablePlayers: [] });
  });

  it('undo on an opponent pick restores equivalent prior state', () => {
    const state = initialState();
    const afterDraft = draftReducer(state, { type: 'DRAFT_PLAYER', playerId: 'TE1', teamId: 'opp-2' });
    const afterUndo = draftReducer(afterDraft, { type: 'UNDO' });

    expect(availablePlayerIds(afterUndo)).toEqual(availablePlayerIds(state));
    expect({ ...afterUndo, availablePlayers: [] }).toEqual({ ...state, availablePlayers: [] });
  });

  it('undo on an empty pick history is a no-op', () => {
    const state = initialState();
    expect(draftReducer(state, { type: 'UNDO' })).toEqual(state);
  });

  it('ignores drafting a player that is not available', () => {
    const state = initialState();
    expect(draftReducer(state, { type: 'DRAFT_PLAYER', playerId: 'nope', teamId: USER_TEAM_ID })).toEqual(state);
  });

  it('SET_WEIGHT updates only the weight', () => {
    const state = initialState();
    const next = draftReducer(state, { type: 'SET_WEIGHT', weight: 0.8 });
    expect(next.bpaVsNeedWeight).toBe(0.8);
    expect(next.availablePlayers).toBe(state.availablePlayers);
  });
});
