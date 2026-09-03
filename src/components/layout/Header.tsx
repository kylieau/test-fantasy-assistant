import type { DraftState } from '../../domain/draft';
import { useDraft } from '../../state/DraftContext';

export function Header({ state }: { state: DraftState | null }) {
  const { undo, goToSetup } = useDraft();
  const round = state ? Math.ceil(state.currentPick / state.leagueSettings.teamCount) : null;

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1>Fantasy Draft Assistant</h1>
        <span className="demo-data-label">Demo player data — not real 2026 projections</span>
      </div>
      {state && (
        <div className="app-header__status">
          <span>
            Pick {state.currentPick} (Round {round})
          </span>
          <button type="button" onClick={undo} disabled={state.picksMade.length === 0}>
            Undo
          </button>
          <button type="button" onClick={goToSetup}>
            New Draft
          </button>
        </div>
      )}
    </header>
  );
}
