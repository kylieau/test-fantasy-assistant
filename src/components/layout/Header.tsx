import { useState } from 'react';
import type { DraftState } from '../../domain/draft';
import { useDraft } from '../../state/DraftContext';

function formatSecondsAgo(lastSyncedAt: number | null): string {
  if (lastSyncedAt === null) return 'syncing…';
  const seconds = Math.max(0, Math.round((Date.now() - lastSyncedAt) / 1000));
  return `synced ${seconds}s ago`;
}

export function Header({ state }: { state: DraftState | null }) {
  const { undo, resetDraft, goToSetup, saveNow, sleeperSyncStatus, switchToManualEntry } = useDraft();
  const [savedFlash, setSavedFlash] = useState(false);
  const round = state ? Math.ceil(state.currentPick / state.leagueSettings.teamCount) : null;
  const isSleeper = state?.leagueSettings.platform === 'sleeper';

  async function handleSave() {
    await saveNow();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  let statusLabel = 'Manual entry';
  if (isSleeper) {
    if (sleeperSyncStatus?.state === 'error') {
      statusLabel = 'Sync error';
    } else if (sleeperSyncStatus?.state === 'connecting') {
      statusLabel = 'Connecting…';
    } else {
      statusLabel = `Live via Sleeper · ${formatSecondsAgo(sleeperSyncStatus?.lastSyncedAt ?? null)}`;
    }
  }

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1>Fantasy Draft Assistant</h1>
        <span className="demo-data-label">Demo player data — not real 2026 projections</span>
      </div>
      {state && (
        <div className="app-header__status">
          <span className="app-header__pick">
            Pick {state.currentPick} (Round {round}) · {statusLabel}
          </span>
          <span className="app-header__progress">
            Drafted {state.picksMade.length} · My picks {state.userRoster.length} · Left{' '}
            {state.availablePlayers.length}
          </span>
          <div className="app-header__actions">
            {isSleeper && sleeperSyncStatus?.state === 'error' && (
              <button
                type="button"
                className="icon-button"
                onClick={switchToManualEntry}
                title="Stop live sync and continue entering picks manually"
              >
                Switch to Manual
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              onClick={undo}
              disabled={state.picksMade.length === 0 || isSleeper}
              title={isSleeper ? 'Not available in live Sleeper mode' : 'Undo last pick'}
            >
              Undo
            </button>
            <button type="button" className="icon-button" onClick={handleSave} title="Save draft now">
              {savedFlash ? 'Saved ✓' : 'Save'}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={resetDraft}
              disabled={isSleeper}
              title={isSleeper ? 'Not available in live Sleeper mode' : 'Reset this draft back to pick 1'}
            >
              Reset
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={goToSetup}
              title="Return to League Rules and start a new draft"
            >
              New League
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
