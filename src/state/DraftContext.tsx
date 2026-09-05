import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DraftState } from '../domain/draft';
import { USER_TEAM_ID } from '../domain/draft';
import type { LeagueSettings } from '../domain/roster';
import type { DraftStrategy } from '../domain/strategy';
import { ManualAdapter } from '../adapters/manual/manualAdapter';
import { SleeperAdapter, connectToSleeperDraft, type SleeperSyncStatus } from '../adapters/sleeper/sleeperAdapter';
import type { DraftAdapter } from '../adapters/types';
import { clearDraftState, loadDraftState, saveDraftState } from '../persistence/draftRepository';
import { loadSavedDraft, saveDraftAs } from '../persistence/savedDraftsRepository';
import { SEED_PLAYERS } from '../data/seed/derived';

interface DraftContextValue {
  state: DraftState | null;
  isLoading: boolean;
  sleeperSyncStatus: SleeperSyncStatus | null;
  draftPlayer: (playerId: string, teamId: string) => void;
  undo: () => void;
  setStrategy: (strategy: DraftStrategy) => void;
  toggleFavorite: (playerId: string) => void;
  startNewDraft: (leagueSettings: LeagueSettings, strategy: DraftStrategy) => void;
  connectSleeperDraft: (
    draftId: string,
    username: string,
    strategy: DraftStrategy,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  switchToManualEntry: () => void;
  resetDraft: () => void;
  goToSetup: () => void;
  saveNow: () => Promise<void>;
  saveCurrentDraftAs: (label: string) => Promise<void>;
  loadSavedDraftById: (id: string) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<DraftAdapter | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sleeperSyncStatus, setSleeperSyncStatus] = useState<SleeperSyncStatus | null>(null);
  // Mutable ref alongside the adapter state so stop() can be called on the *previous*
  // adapter when switching away, without waiting for a render.
  const adapterRef = useRef<DraftAdapter | null>(null);

  function setActiveAdapter(next: DraftAdapter) {
    if (adapterRef.current instanceof SleeperAdapter) {
      adapterRef.current.stop();
    }
    adapterRef.current = next;
    setAdapter(next);
  }

  useEffect(() => {
    let cancelled = false;
    void loadDraftState().then((loaded) => {
      if (cancelled) return;
      if (loaded) {
        // A persisted Sleeper draft can't resume live polling after a refresh (we'd need to
        // re-run the connect flow); it reopens read-only under ManualAdapter's plumbing so
        // the UI still renders correctly, just without further live updates until reconnected.
        setActiveAdapter(new ManualAdapter(loaded));
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

  useEffect(() => {
    return () => {
      if (adapterRef.current instanceof SleeperAdapter) {
        adapterRef.current.stop();
      }
    };
  }, []);

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
    setSleeperSyncStatus(null);
    setActiveAdapter(new ManualAdapter(initialState));
    setState(initialState);
    void saveDraftState(initialState);
  }

  async function connectSleeperDraft(draftId: string, username: string, strategy: DraftStrategy) {
    setSleeperSyncStatus({ state: 'connecting' });
    try {
      const { adapter: sleeperAdapter, initialState } = await connectToSleeperDraft(
        draftId,
        username,
        strategy,
        setSleeperSyncStatus,
      );
      setActiveAdapter(sleeperAdapter);
      setState(initialState);
      void saveDraftState(initialState);
      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect to that Sleeper draft.';
      setSleeperSyncStatus(null);
      return { ok: false as const, error: message };
    }
  }

  function switchToManualEntry() {
    if (!state) return;
    const manualState: DraftState = {
      ...state,
      leagueSettings: { ...state.leagueSettings, platform: 'manual' },
    };
    setSleeperSyncStatus(null);
    setActiveAdapter(new ManualAdapter(manualState));
    setState(manualState);
    void saveDraftState(manualState);
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
    // Sleeper mode has no UI surface that calls this (recommendations are gated off), so
    // this only ever needs to handle ManualAdapter in practice.
    if (adapter instanceof ManualAdapter) {
      adapter.setStrategy(strategy);
      void saveDraftState(adapter.getState());
    }
  }

  function toggleFavorite(playerId: string) {
    if (!adapter) return;
    adapter.toggleFavorite(playerId);
    void saveDraftState(adapter.getState());
  }

  function goToSetup() {
    if (adapterRef.current instanceof SleeperAdapter) {
      adapterRef.current.stop();
    }
    adapterRef.current = null;
    setAdapter(null);
    setState(null);
    setSleeperSyncStatus(null);
    void clearDraftState();
  }

  async function saveNow() {
    if (!adapter) return;
    await saveDraftState(adapter.getState());
  }

  async function saveCurrentDraftAs(label: string) {
    if (!adapter) return;
    await saveDraftAs(label, adapter.getState());
  }

  async function loadSavedDraftById(id: string) {
    const saved = await loadSavedDraft(id);
    if (!saved) return;
    // Same "reopens read-only under ManualAdapter's plumbing" treatment as the startup
    // load path above — a saved Sleeper draft can't resume live polling from a snapshot.
    setSleeperSyncStatus(null);
    setActiveAdapter(new ManualAdapter(saved.state));
    setState(saved.state);
    void saveDraftState(saved.state);
  }

  const value: DraftContextValue = {
    state,
    isLoading,
    sleeperSyncStatus,
    draftPlayer,
    undo,
    setStrategy,
    toggleFavorite,
    startNewDraft,
    connectSleeperDraft,
    switchToManualEntry,
    resetDraft,
    goToSetup,
    saveNow,
    saveCurrentDraftAs,
    loadSavedDraftById,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider');
  return ctx;
}
