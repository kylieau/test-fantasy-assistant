import type { Player } from './player';
import type { LeagueSettings } from './roster';
import type { DraftStrategy } from './strategy';

export interface Pick {
  pickNumber: number;
  player: Player;
  teamId: string;
}

export const USER_TEAM_ID = 'user';

export interface DraftState {
  leagueSettings: LeagueSettings;
  picksMade: Pick[];
  availablePlayers: Player[];
  currentPick: number;
  userTeamId: string;
  userRoster: Player[];
  opponentRosters: Record<string, Player[]>;
  strategy: DraftStrategy;
  favoritedPlayerIds: string[];
  // Deliberately omitted for Phase 1, added later without breaking this shape:
  //   remaining_seconds, opponent_profiles, is_connected, category_z_scores
}
