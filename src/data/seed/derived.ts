import type { Player } from '../../domain/player';
import { computePositionRanks } from '../../engine/positionRank';
import { computeTiers } from '../../engine/tiers';
import seedPlayersRaw from './nfl-players-2026-placeholder.json';

export const SEED_PLAYERS = seedPlayersRaw as Player[];

/** Static per-player badges (e.g. "WR2", tier 3) computed once from the full seed pool. */
export const POSITION_RANKS: Record<string, number> = computePositionRanks(SEED_PLAYERS);
export const TIERS: Record<string, number> = computeTiers(SEED_PLAYERS);
