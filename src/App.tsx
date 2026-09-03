import { useState } from 'react';
import { DraftProvider, useDraft } from './state/DraftContext';
import { AppShell, type AppView } from './components/layout/AppShell';
import { LeagueSetupForm } from './components/setup/LeagueSetupForm';
import { DraftBoard } from './components/board/DraftBoard';
import { AllRostersView } from './components/rosters/AllRostersView';
import { MyRosterView } from './components/rosters/MyRosterView';

function AppContent() {
  const { state, isLoading } = useDraft();
  const [view, setView] = useState<AppView>('draft');

  let content;
  if (isLoading) {
    content = <p>Loading…</p>;
  } else if (!state) {
    content = <LeagueSetupForm />;
  } else if (view === 'myRoster') {
    content = <MyRosterView />;
  } else if (view === 'rosters') {
    content = <AllRostersView />;
  } else {
    content = <DraftBoard />;
  }

  return (
    <AppShell state={state} view={view} onViewChange={setView}>
      {content}
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
