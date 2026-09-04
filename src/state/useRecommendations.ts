import { useMemo } from 'react';
import type { DraftState } from '../domain/draft';
import { computeFilledRosterSlots } from '../domain/roster';
import { resolveStrategyWeight } from '../domain/strategy';
import { rankRecommendations } from '../engine/recommend';
import type { Recommendation } from '../engine/types';

/**
 * Ranks the full available player pool; callers slice for a "top N" view as needed.
 * Returns [] when the league has no usable projections (e.g. a live Sleeper draft whose ESPN
 * projections merge failed) rather than running the engine on sentinel/zeroed values.
 */
export function useRecommendations(state: DraftState | null): Recommendation[] {
  return useMemo(() => {
    if (!state || !state.leagueSettings.hasProjections) return [];
    const rosterSlots = computeFilledRosterSlots(state.leagueSettings.rosterSlots, state.userRoster);
    const weight = resolveStrategyWeight(state.strategy, rosterSlots);
    return rankRecommendations(
      state.availablePlayers,
      state.leagueSettings,
      rosterSlots,
      weight,
      state.availablePlayers.length,
    );
  }, [state]);
}
