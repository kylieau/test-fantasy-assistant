import type { Player, Position } from '../../domain/player';
import type { SleeperPickMetadata, SleeperPlayer } from './sleeperTypes';

const SUPPORTED_POSITIONS = new Set<string>(['QB', 'RB', 'WR', 'TE', 'K', 'DST']);

/**
 * Sentinel for adp/rank on a player with no real ranking data (yet). Lower is "better" for
 * both fields, so the sentinel must be a large number, not 0 — 0 would sort an unranked
 * player ahead of every real #1 overall pick in an ascending sort.
 */
const UNRANKED = 9999;

/** Sleeper uses 'DEF' for team defense/special teams; we use 'DST'. Other positions match. */
function mapSleeperPosition(rawPosition: string | null | undefined): Position | null {
  if (!rawPosition) return null;
  const normalized = rawPosition === 'DEF' ? 'DST' : rawPosition;
  return SUPPORTED_POSITIONS.has(normalized) ? (normalized as Position) : null;
}

/**
 * Maps a raw Sleeper player to our Player shape. Sleeper has no projections/ADP of its own —
 * adp/rank start at the UNRANKED sentinel and projected_points at 0 until real values are
 * merged in from elsewhere (see src/data/espnProjections). Returns null for positions we
 * don't track (IDP, superflex-only slots, etc.).
 */
export function mapSleeperPlayer(raw: SleeperPlayer): Player | null {
  const position = mapSleeperPosition(raw.fantasy_positions?.[0] ?? raw.position);
  if (!position) return null;

  const name =
    raw.full_name || [raw.first_name, raw.last_name].filter(Boolean).join(' ') || raw.team || raw.player_id;

  return {
    id: raw.player_id,
    name,
    position: [position],
    team: raw.team ?? 'FA',
    sport: 'NFL',
    adp: UNRANKED,
    rank: UNRANKED,
    projected_points: 0,
  };
}

/**
 * Fallback mapping from a draft pick's embedded metadata, for resilience when a picked
 * player_id isn't found in the cached player database (e.g. cache fetched before a very
 * recent roster move). Not the common path — mapSleeperPlayer via the cached lookup is.
 */
export function mapSleeperPickMetadata(playerId: string, metadata: SleeperPickMetadata | null): Player | null {
  if (!metadata) return null;
  const position = mapSleeperPosition(metadata.position);
  if (!position) return null;

  const name = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') || metadata.team || playerId;

  return {
    id: playerId,
    name,
    position: [position],
    team: metadata.team ?? 'FA',
    sport: 'NFL',
    adp: UNRANKED,
    rank: UNRANKED,
    projected_points: 0,
  };
}
