import type { Position } from '../../domain/player';
import type { EspnRawPlayer } from './espnProjectionsTypes';

const POSITION_ID_MAP: Record<number, Position> = {
  1: 'QB',
  2: 'RB',
  3: 'WR',
  4: 'TE',
  5: 'K',
  16: 'DST',
};

/** ESPN represents team defenses as e.g. "Texans D/ST" with no proTeamId — resolve by nickname. */
const DST_NICKNAME_TO_ABBR: Record<string, string> = {
  Bills: 'BUF', Dolphins: 'MIA', Patriots: 'NE', Jets: 'NYJ',
  Ravens: 'BAL', Bengals: 'CIN', Browns: 'CLE', Steelers: 'PIT',
  Texans: 'HOU', Colts: 'IND', Jaguars: 'JAX', Titans: 'TEN',
  Broncos: 'DEN', Chiefs: 'KC', Raiders: 'LV', Chargers: 'LAC',
  Cowboys: 'DAL', Giants: 'NYG', Eagles: 'PHI', Commanders: 'WAS',
  Bears: 'CHI', Lions: 'DET', Packers: 'GB', Vikings: 'MIN',
  Falcons: 'ATL', Panthers: 'CAR', Saints: 'NO', Buccaneers: 'TB',
  Cardinals: 'ARI', Rams: 'LAR', '49ers': 'SF', Seahawks: 'SEA',
};

/** Lowercase, strip punctuation and generational suffixes, collapse whitespace. */
export function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Texans D/ST" -> "HOU", or null if the nickname isn't recognized. */
export function resolveDstTeam(fullName: string): string | null {
  const nickname = fullName.replace(/\s*D\/ST$/i, '').trim();
  return DST_NICKNAME_TO_ABBR[nickname] ?? null;
}

export interface EspnProjectionEntry {
  adp: number;
  rank: number;
  projected_points: number;
}

export interface EspnProjectionIndex {
  byNameAndPosition: Map<string, EspnProjectionEntry>;
  byDstTeam: Map<string, EspnProjectionEntry>;
}

export function nameAndPositionKey(name: string, position: Position): string {
  return `${normalizePlayerName(name)}|${position}`;
}

/**
 * Builds a lookup from ESPN's raw player list, keyed for matching against Sleeper's real
 * players by normalized name (+ position, since the two platforms use unrelated player ID
 * namespaces). Only includes players with a full season-total projection for the given season
 * — players ESPN doesn't project are simply absent, not zeroed.
 */
export function buildEspnProjectionIndex(rawPlayers: EspnRawPlayer[], season: number): EspnProjectionIndex {
  const byNameAndPosition = new Map<string, EspnProjectionEntry>();
  const byDstTeam = new Map<string, EspnProjectionEntry>();

  for (const raw of rawPlayers) {
    const player = raw.player;
    const position = POSITION_ID_MAP[player.defaultPositionId];
    if (!position) continue;

    const seasonProjection = player.stats?.find(
      (s) => s.statSourceId === 1 && s.scoringPeriodId === 0 && s.seasonId === season,
    );
    if (!seasonProjection) continue;

    const rank = player.draftRanksByRankType?.PPR?.rank ?? player.draftRanksByRankType?.STANDARD?.rank;
    const adp = player.ownership?.averageDraftPosition;
    if (rank === undefined || adp === undefined) continue;

    const entry: EspnProjectionEntry = { adp, rank, projected_points: seasonProjection.appliedTotal };

    if (position === 'DST') {
      const team = resolveDstTeam(player.fullName);
      if (team) byDstTeam.set(team, entry);
    } else {
      byNameAndPosition.set(nameAndPositionKey(player.fullName, position), entry);
    }
  }

  return { byNameAndPosition, byDstTeam };
}
