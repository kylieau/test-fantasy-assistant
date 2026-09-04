import { useMemo } from 'react';
import type { DraftState } from '../domain/draft';
import { computePositionRanks } from '../engine/positionRank';
import { computeTiers } from '../engine/tiers';
import { POSITION_RANKS, TIERS } from '../data/seed/derived';

/**
 * Manual mode uses the precomputed seed-derived constants (cheap, and identical to what
 * computing them fresh would give, since the seed list is the full player universe).
 * Sleeper mode (once it has real ESPN-merged projections) computes them from the full
 * original pool — available players plus everyone already drafted — so ranks/tiers stay
 * stable as the draft progresses, rather than shifting as players are removed from
 * availablePlayers. This intentionally recomputes on every state change rather than once at
 * connect time: the *set* of players is constant regardless of who's been drafted, so the
 * result is stable, and it means a page refresh (which loses the live connection but keeps
 * the persisted player data) still shows correct badges.
 */
export function usePositionRanksAndTiers(state: DraftState | null): {
  positionRanks: Record<string, number>;
  tiers: Record<string, number>;
} {
  return useMemo(() => {
    if (!state) return { positionRanks: {}, tiers: {} };

    if (state.leagueSettings.platform === 'manual') {
      return { positionRanks: POSITION_RANKS, tiers: TIERS };
    }

    if (!state.leagueSettings.hasProjections) {
      return { positionRanks: {}, tiers: {} };
    }

    const fullPool = [
      ...state.availablePlayers,
      ...state.userRoster,
      ...Object.values(state.opponentRosters).flat(),
    ];
    return { positionRanks: computePositionRanks(fullPool), tiers: computeTiers(fullPool) };
  }, [state]);
}
