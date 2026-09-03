import { useState } from 'react';
import type { DraftState } from '../../domain/draft';
import { useDraft } from '../../state/DraftContext';

export function Header({ state }: { state: DraftState | null }) {
  const { undo, resetDraft, goToSetup, saveNow } = useDraft();
  const [savedFlash, setSavedFlash] = useState(false);
  const round = state ? Math.ceil(state.currentPick / state.leagueSettings.teamCount) : null;

  async function handleSave() {
    await saveNow();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
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
            Pick {state.currentPick} (Round {round}) · Manual entry
          </span>
          <div className="app-header__actions">
            <button
              type="button"
              className="icon-button"
              onClick={undo}
              disabled={state.picksMade.length === 0}
              title="Undo last pick"
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
              title="Reset this draft back to pick 1"
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
