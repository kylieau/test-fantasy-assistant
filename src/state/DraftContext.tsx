import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DraftState } from '../domain/draft';
import { USER_TEAM_ID } from '../domain/draft';
import type { LeagueSettings } from '../domain/roster';
import type { DraftStrategy } from '../domain/strategy';
import { ManualAdapter } from '../adapters/manual/manualAdapter';
import { clearDraftState, loadDraftState, saveDraftState } from '../persistence/draftRepository';
import { SEED_PLAYERS } from '../data/seed/derived';

interface DraftContextValue {
  state: DraftState | null;
  isLoading: boolean;
  draftPlayer: (playerId: string, teamId: string) => void;
  undo: () => void;
  setStrategy: (strategy: DraftStrategy) => void;
  toggleFavorite: (playerId: string) => void;
  startNewDraft: (leagueSettings: LeagueSettings, strategy: DraftStrategy) => void;
  resetDraft: () => void;
  goToSetup: () => void;
  saveNow: () => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<ManualAdapter | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadDraftState().then((loaded) => {
      if (cancelled) return;
      if (loaded) {
        setAdapter(new ManualAdapter(loaded));
        setState(loaded);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adapter) return;
    return adapter.subscribe(setState);
  }, [adapter]);

  function startNewDraft(leagueSettings: LeagueSettings, strategy: DraftStrategy) {
    const initialState: DraftState = {
      leagueSettings,
      picksMade: [],
      availablePlayers: SEED_PLAYERS,
      currentPick: 1,
      userTeamId: USER_TEAM_ID,
      userRoster: [],
      opponentRosters: {},
      strategy,
      favoritedPlayerIds: [],
    };
    setAdapter(new ManualAdapter(initialState));
    setState(initialState);
    void saveDraftState(initialState);
  }

  function resetDraft() {
    if (!state) return;
    startNewDraft(state.leagueSettings, state.strategy);
  }

  function draftPlayer(playerId: string, teamId: string) {
    if (!adapter) return;
    adapter.markDrafted(playerId, teamId);
    void saveDraftState(adapter.getState());
  }

  function undo() {
    if (!adapter) return;
    adapter.undoLastPick();
    void saveDraftState(adapter.getState());
  }

  function setStrategy(strategy: DraftStrategy) {
    if (!adapter) return;
    adapter.setStrategy(strategy);
    void saveDraftState(adapter.getState());
  }

  function toggleFavorite(playerId: string) {
    if (!adapter) return;
    adapter.toggleFavorite(playerId);
    void saveDraftState(adapter.getState());
  }

  function goToSetup() {
    setAdapter(null);
    setState(null);
    void clearDraftState();
  }

  async function saveNow() {
    if (!adapter) return;
    await saveDraftState(adapter.getState());
  }

  const value: DraftContextValue = {
    state,
    isLoading,
    draftPlayer,
    undo,
    setStrategy,
    toggleFavorite,
    startNewDraft,
    resetDraft,
    goToSetup,
    saveNow,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider');
  return ctx;
}
