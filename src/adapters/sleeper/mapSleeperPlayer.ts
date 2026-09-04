import type { Player, Position } from '../../domain/player';
import type { SleeperPickMetadata, SleeperPlayer } from './sleeperTypes';

const SUPPORTED_POSITIONS = new Set<string>(['QB', 'RB', 'WR', 'TE', 'K', 'DST']);

/** Sleeper uses 'DEF' for team defense/special teams; we use 'DST'. Other positions match. */
function mapSleeperPosition(rawPosition: string | null | undefined): Position | null {
  if (!rawPosition) return null;
  const normalized = rawPosition === 'DEF' ? 'DST' : rawPosition;
  return SUPPORTED_POSITIONS.has(normalized) ? (normalized as Position) : null;
}

/**
 * Maps a raw Sleeper player to our Player shape. Sleeper has no projections/ADP, so those
 * fields get an explicit sentinel of 0 — callers must gate recommendation-engine usage
 * behind `leagueSettings.platform === 'manual'` rather than relying on these values.
 * Returns null for positions we don't track (IDP, superflex-only slots, etc.).
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
    adp: 0,
    rank: 0,
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
    adp: 0,
    rank: 0,
    projected_points: 0,
  };
}
