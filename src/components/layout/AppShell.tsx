import type { ReactNode } from 'react';
import type { DraftState } from '../../domain/draft';
import { Header } from './Header';

export function AppShell({ state, children }: { state: DraftState | null; children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header state={state} />
      <main className="app-main">{children}</main>
    </div>
  );
}
