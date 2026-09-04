import { useMemo } from 'react';
import type { DraftState } from '../domain/draft';
import { computeFilledRosterSlots } from '../domain/roster';
import { resolveStrategyWeight } from '../domain/strategy';
import { rankRecommendations } from '../engine/recommend';
import type { Recommendation } from '../engine/types';

/**
 * Ranks the full available player pool; callers slice for a "top N" view as needed.
 * Returns [] for non-'manual' platforms (e.g. Sleeper) rather than running the engine on
 * players with sentinel/zeroed projections — there's no real data to rank there yet.
 */
export function useRecommendations(state: DraftState | null): Recommendation[] {
  return useMemo(() => {
    if (!state || state.leagueSettings.platform !== 'manual') return [];
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
