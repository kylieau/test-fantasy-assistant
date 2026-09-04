/** Raw ESPN fantasy API shapes we actually use — trimmed to the fields this app reads. */

export interface EspnStatEntry {
  id: string;
  seasonId: number;
  scoringPeriodId: number;
  statSourceId: number; // 0 = actual, 1 = projected
  appliedTotal: number;
}

export interface EspnDraftRank {
  rank: number;
}

export interface EspnOwnership {
  averageDraftPosition: number;
}

export interface EspnRawPlayer {
  player: {
    id: number;
    fullName: string;
    defaultPositionId: number;
    proTeamId?: number;
    draftRanksByRankType?: Record<string, EspnDraftRank>;
    ownership?: EspnOwnership;
    stats?: EspnStatEntry[];
  };
}

export interface EspnBulkResponse {
  players: EspnRawPlayer[];
}
