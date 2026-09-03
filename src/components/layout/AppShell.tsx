import type { ReactNode } from 'react';
import type { DraftState } from '../../domain/draft';
import { Header } from './Header';

export type AppView = 'draft' | 'myRoster' | 'rosters';

const TABS: { view: AppView; label: string }[] = [
  { view: 'draft', label: 'Draft Board' },
  { view: 'myRoster', label: 'My Roster' },
  { view: 'rosters', label: 'All Rosters' },
];

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
          {TABS.map((tab) => (
            <button
              key={tab.view}
              type="button"
              className={`app-tab ${view === tab.view ? 'app-tab--active' : ''}`}
              onClick={() => onViewChange(tab.view)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
      <main className="app-main">{children}</main>
    </div>
  );
}
