import { draftReducer, type DraftAction } from '../../state/draftReducer';
import type { DraftState } from '../../domain/draft';
import type { DraftAdapter } from '../types';

/**
 * Local-first fallback adapter driven by manual tap entry. Implements the same
 * DraftAdapter interface a future live SleeperAdapter/YahooAdapter/ESPNAdapter would,
 * so the recommendation engine and UI never need to know which is active.
 */
export class ManualAdapter implements DraftAdapter {
  private state: DraftState;
  private readonly listeners = new Set<(state: DraftState) => void>();

  constructor(initialState: DraftState) {
    this.state = initialState;
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

  markDrafted(playerId: string, teamId: string): void {
    this.dispatch({ type: 'DRAFT_PLAYER', playerId, teamId });
  }

  undoLastPick(): void {
    this.dispatch({ type: 'UNDO' });
  }

  setBpaVsNeedWeight(weight: number): void {
    this.dispatch({ type: 'SET_WEIGHT', weight });
  }

  subscribe(onChange: (state: DraftState) => void): () => void {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  }

  private dispatch(action: DraftAction): void {
    this.state = draftReducer(this.state, action);
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
