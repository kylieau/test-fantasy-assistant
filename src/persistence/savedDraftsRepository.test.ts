import { describe, expect, it } from 'vitest';
import { deleteSavedDraft, listSavedDrafts, loadSavedDraft, saveDraftAs } from './savedDraftsRepository';
import { createDefaultLeagueSettings } from '../domain/roster';
import type { DraftState } from '../domain/draft';
import { USER_TEAM_ID } from '../domain/draft';

function emptyDraftState(currentPick = 1): DraftState {
  return {
    leagueSettings: createDefaultLeagueSettings(4),
    picksMade: [],
    availablePlayers: [],
    currentPick,
    userTeamId: USER_TEAM_ID,
    userRoster: [],
    opponentRosters: {},
    strategy: 'balanced',
    favoritedPlayerIds: [],
  };
}

describe('savedDraftsRepository', () => {
  it('saves a labeled draft and round-trips it by id', async () => {
    const id = await saveDraftAs('My 2026 Keeper League', emptyDraftState(9));

    const loaded = await loadSavedDraft(id);
    expect(loaded?.label).toBe('My 2026 Keeper League');
    expect(loaded?.state.currentPick).toBe(9);
  });

  it('lists saved drafts newest-first', async () => {
    const firstId = await saveDraftAs('Older', emptyDraftState());
    const secondId = await saveDraftAs('Newer', emptyDraftState());

    const drafts = await listSavedDrafts();
    const ids = drafts.map((d) => d.id);
    expect(ids.indexOf(secondId)).toBeLessThan(ids.indexOf(firstId));
  });

  it('deletes a saved draft', async () => {
    const id = await saveDraftAs('Temp', emptyDraftState());
    await deleteSavedDraft(id);
    expect(await loadSavedDraft(id)).toBeUndefined();
  });
});
