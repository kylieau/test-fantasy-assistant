import type { EspnBulkResponse, EspnRawPlayer } from './espnProjectionsTypes';

const BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons';

/**
 * NFL fantasy season names roll over around March, after the Super Bowl and before the next
 * league year's rankings start forming — not on Jan 1. Approximate rather than hardcode a year.
 */
export function currentFantasySeason(now: Date = new Date()): number {
  const rolloverMonth = 2; // March (0-indexed)
  return now.getMonth() >= rolloverMonth ? now.getFullYear() : now.getFullYear() - 1;
}

let projectionsCache: Promise<EspnRawPlayer[]> | null = null;

/** Fetched once per session and cached — ADP/projections don't change every poll. */
export function getEspnProjections(season: number = currentFantasySeason()): Promise<EspnRawPlayer[]> {
  if (!projectionsCache) {
    projectionsCache = fetch(`${BASE_URL}/${season}/segments/0/leaguedefaults/3?view=kona_player_info`, {
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: { limit: 3000, sortDraftRanks: { sortPriority: 1, sortAsc: true, value: 'STANDARD' } },
        }),
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`ESPN projections request failed (${response.status})`);
      }
      return response.json() as Promise<EspnBulkResponse>;
    }).then((data) => data.players);
  }
  return projectionsCache;
}
