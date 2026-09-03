import type { ReactNode } from 'react';
import type { DraftState } from '../../domain/draft';
import { Header } from './Header';

export type AppView = 'draft' | 'rosters';

export function AppShell({
  state,
  view,
  onViewChange,
  children,
}: {
  state: DraftState | null;
  view: AppView;
  onViewChange: (view: AppView) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Header state={state} />
      {state && (
        <nav className="app-tabs">
          <button
            type="button"
            className={`app-tab ${view === 'draft' ? 'app-tab--active' : ''}`}
            onClick={() => onViewChange('draft')}
          >
            Draft Board
          </button>
          <button
            type="button"
            className={`app-tab ${view === 'rosters' ? 'app-tab--active' : ''}`}
            onClick={() => onViewChange('rosters')}
          >
            All Rosters
          </button>
        </nav>
      )}
      <main className="app-main">{children}</main>
    </div>
  );
}
