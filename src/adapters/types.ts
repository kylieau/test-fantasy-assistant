import type { DraftState } from '../domain/draft';
import type { LeagueSettings } from '../domain/roster';
import type { Player } from '../domain/player';

/**
 * Shared contract every platform adapter implements (Sleeper/Yahoo/ESPN in future phases,
 * ManualAdapter today). The recommendation engine and UI depend only on this interface.
 */
export interface DraftAdapter {
  getState(): DraftState;
  getLeagueSettings(): LeagueSettings;
  getAvailablePlayers(): Player[];
  markDrafted(playerId: string, teamId: string): void;
  undoLastPick(): void;
  toggleFavorite(playerId: string): void;
  subscribe(onChange: (state: DraftState) => void): () => void;
}
