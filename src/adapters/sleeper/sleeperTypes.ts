/** Raw Sleeper API shapes we actually use — trimmed to the fields this app reads. */

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

export interface SleeperDraftSettings {
  teams: number;
  rounds: number;
  slots_qb?: number;
  slots_rb?: number;
  slots_wr?: number;
  slots_te?: number;
  slots_flex?: number;
  slots_def?: number;
  slots_k?: number;
  slots_bn?: number;
  [key: string]: number | undefined;
}

export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  type: 'snake' | 'linear' | 'auction' | string;
  status: string;
  season: string;
  settings: SleeperDraftSettings;
  /** user_id -> 1-based draft slot */
  draft_order: Record<string, number> | null;
  /** draft slot -> roster_id */
  slot_to_roster_id: Record<string, number> | null;
}

export interface SleeperPickMetadata {
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
}

export interface SleeperPick {
  player_id: string;
  picked_by: string | null;
  roster_id: number | string;
  pick_no: number;
  round: number;
  draft_slot: number;
  metadata: SleeperPickMetadata | null;
}

export interface SleeperLeagueUser {
  user_id: string;
  display_name: string;
}

export interface SleeperLeagueRoster {
  roster_id: number;
  owner_id: string | null;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  fantasy_positions?: string[] | null;
  team?: string | null;
}
