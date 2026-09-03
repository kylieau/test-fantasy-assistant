import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DraftState } from '../domain/draft';
import { USER_TEAM_ID } from '../domain/draft';
import type { LeagueSettings } from '../domain/roster';
import type { Player } from '../domain/player';
import { DEFAULT_BPA_VS_NEED_WEIGHT } from '../engine/recommend';
import { ManualAdapter } from '../adapters/manual/manualAdapter';
import { clearDraftState, loadDraftState, saveDraftState } from '../persistence/draftRepository';
import seedPlayersRaw from '../data/seed/nfl-players-2026-placeholder.json';

const seedPlayers = seedPlayersRaw as Player[];

interface DraftContextValue {
  state: DraftState | null;
  isLoading: boolean;
  draftPlayer: (playerId: string, teamId: string) => void;
  undo: () => void;
  setWeight: (weight: number) => void;
  startNewDraft: (leagueSettings: LeagueSettings) => void;
  goToSetup: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

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

  const debouncedSave = useMemo(() => debounce((s: DraftState) => void saveDraftState(s), 150), []);

  function startNewDraft(leagueSettings: LeagueSettings) {
    const initialState: DraftState = {
      leagueSettings,
      picksMade: [],
      availablePlayers: seedPlayers,
      currentPick: 1,
      userTeamId: USER_TEAM_ID,
      userRoster: [],
      opponentRosters: {},
      bpaVsNeedWeight: DEFAULT_BPA_VS_NEED_WEIGHT,
    };
    setAdapter(new ManualAdapter(initialState));
    setState(initialState);
    void saveDraftState(initialState);
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

  function setWeight(weight: number) {
    if (!adapter) return;
    adapter.setBpaVsNeedWeight(weight);
    debouncedSave(adapter.getState());
  }

  function goToSetup() {
    setAdapter(null);
    setState(null);
    void clearDraftState();
  }

  const value: DraftContextValue = {
    state,
    isLoading,
    draftPlayer,
    undo,
    setWeight,
    startNewDraft,
    goToSetup,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider');
  return ctx;
}
