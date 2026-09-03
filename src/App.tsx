import { DraftProvider, useDraft } from './state/DraftContext';
import { AppShell } from './components/layout/AppShell';
import { LeagueSetupForm } from './components/setup/LeagueSetupForm';
import { DraftBoard } from './components/board/DraftBoard';

function AppContent() {
  const { state, isLoading } = useDraft();

  return (
    <AppShell state={state}>
      {isLoading ? <p>Loading…</p> : state ? <DraftBoard /> : <LeagueSetupForm />}
    </AppShell>
  );
}

export default function App() {
  return (
    <DraftProvider>
      <AppContent />
    </DraftProvider>
  );
}
