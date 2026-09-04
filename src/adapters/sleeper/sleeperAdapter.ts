import { draftReducer, type DraftAction } from '../../state/draftReducer';
import type { DraftState } from '../../domain/draft';
import type { Player } from '../../domain/player';
import type { DraftStrategy } from '../../domain/strategy';
import type { DraftAdapter } from '../types';
import type { SleeperPick, SleeperPlayer } from './sleeperTypes';
import { mapSleeperPickMetadata, mapSleeperPlayer } from './mapSleeperPlayer';
import { buildLeagueSettingsFromSleeper } from './buildLeagueSettingsFromSleeper';
import * as sleeperClient from './sleeperClient';

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;

export type SleeperSyncStatus =
  | { state: 'connecting' }
  | { state: 'ok'; lastSyncedAt: number }
  | { state: 'error'; lastSyncedAt: number | null };

/**
 * Read-only live adapter: Sleeper is the source of truth, so markDrafted/undoLastPick are
 * no-ops (the UI doesn't expose draft actions in Sleeper mode at all). Polls for new picks
 * and replays them through the same draftReducer ManualAdapter uses, reusing all existing
 * state machinery unchanged.
 */
export class SleeperAdapter implements DraftAdapter {
  private state: DraftState;
  private readonly listeners = new Set<(state: DraftState) => void>();
  private readonly draftId: string;
  private readonly playersById: Record<string, SleeperPlayer>;
  private readonly appliedPickNos = new Set<number>();
  private readonly onSyncStatusChange: (status: SleeperSyncStatus) => void;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private consecutiveFailures = 0;
  private lastSyncedAt: number | null = null;

  constructor(
    initialState: DraftState,
    draftId: string,
    playersById: Record<string, SleeperPlayer>,
    onSyncStatusChange: (status: SleeperSyncStatus) => void,
  ) {
    this.state = initialState;
    this.draftId = draftId;
    this.playersById = playersById;
    this.onSyncStatusChange = onSyncStatusChange;
  }

  getState(): DraftState {
    return this.state;
  }

  getLeagueSettings() {
    return this.state.leagueSettings;
  }

  getAvailablePlayers() {
    return this.state.availablePlayers;
  }

  markDrafted(): void {
    // No-op: Sleeper is authoritative. Present to satisfy the DraftAdapter interface.
  }

  undoLastPick(): void {
    // No-op: same reasoning as markDrafted.
  }

  toggleFavorite(playerId: string): void {
    this.dispatch({ type: 'TOGGLE_FAVORITE', playerId });
  }

  subscribe(onChange: (state: DraftState) => void): () => void {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /** Applies any picks not yet reflected in state, in pick order. Exposed for initial load. */
  applyNewPicks(picks: SleeperPick[]): void {
    const newPicks = picks
      .filter((pick) => !this.appliedPickNos.has(pick.pick_no))
      .sort((a, b) => a.pick_no - b.pick_no);

    for (const pick of newPicks) {
      this.appliedPickNos.add(pick.pick_no);

      const raw = this.playersById[pick.player_id];
      const player: Player | null = raw
        ? mapSleeperPlayer(raw)
        : mapSleeperPickMetadata(pick.player_id, pick.metadata);

      if (!player) {
        console.warn(`Skipping Sleeper pick ${pick.pick_no}: unsupported/unknown player ${pick.player_id}`);
        continue;
      }

      const teamId = `sleeper-roster-${pick.roster_id}`;
      this.dispatch({ type: 'DRAFT_PLAYER', playerId: player.id, teamId });
    }
  }

  private async poll(): Promise<void> {
    try {
      const picks = await sleeperClient.getDraftPicks(this.draftId);
      this.applyNewPicks(picks);
      this.consecutiveFailures = 0;
      this.lastSyncedAt = Date.now();
      this.onSyncStatusChange({ state: 'ok', lastSyncedAt: this.lastSyncedAt });
    } catch {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        this.stop();
        this.onSyncStatusChange({ state: 'error', lastSyncedAt: this.lastSyncedAt });
      }
    }
  }

  private dispatch(action: DraftAction): void {
    this.state = draftReducer(this.state, action);
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

/**
 * Does all the async Sleeper lookups, builds the initial DraftState (real players, any picks
 * already made in the live draft applied up front), and returns a running SleeperAdapter.
 * Throws on failure (bad username/draft id, unsupported draft type, viewer not in the draft)
 * — callers decide how to surface that.
 */
export async function connectToSleeperDraft(
  draftId: string,
  username: string,
  strategy: DraftStrategy,
  onSyncStatusChange: (status: SleeperSyncStatus) => void,
): Promise<{ adapter: SleeperAdapter; initialState: DraftState }> {
  onSyncStatusChange({ state: 'connecting' });

  const user = await sleeperClient.getUser(username);
  const draft = await sleeperClient.getDraft(draftId);
  const [leagueUsers, leagueRosters, playersById, picks] = await Promise.all([
    sleeperClient.getLeagueUsers(draft.league_id),
    sleeperClient.getLeagueRosters(draft.league_id),
    sleeperClient.getPlayers(),
    sleeperClient.getDraftPicks(draftId),
  ]);

  const { leagueSettings, userTeamId } = buildLeagueSettingsFromSleeper(
    draft,
    leagueUsers,
    leagueRosters,
    user.user_id,
  );

  const availablePlayers = Object.values(playersById)
    .map(mapSleeperPlayer)
    .filter((p): p is Player => p !== null && p.team !== 'FA');

  const initialState: DraftState = {
    leagueSettings,
    picksMade: [],
    availablePlayers,
    currentPick: 1,
    userTeamId,
    userRoster: [],
    opponentRosters: {},
    strategy,
    favoritedPlayerIds: [],
  };

  const adapter = new SleeperAdapter(initialState, draftId, playersById, onSyncStatusChange);
  adapter.applyNewPicks(picks);
  adapter.start();

  // The initial fetch above already succeeded — report 'ok' immediately rather than leaving
  // the caller on 'connecting' until the first poll tick fires (up to POLL_INTERVAL_MS later).
  onSyncStatusChange({ state: 'ok', lastSyncedAt: Date.now() });

  return { adapter, initialState: adapter.getState() };
}
