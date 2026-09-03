import { useMemo } from 'react';
import type { DraftState } from '../domain/draft';
import { computeFilledRosterSlots } from '../domain/roster';
import { rankRecommendations } from '../engine/recommend';
import type { Recommendation } from '../engine/types';

/** Ranks the full available player pool; callers slice for a "top N" view as needed. */
export function useRecommendations(state: DraftState | null): Recommendation[] {
  return useMemo(() => {
    if (!state) return [];
    const rosterSlots = computeFilledRosterSlots(state.leagueSettings.rosterSlots, state.userRoster);
    return rankRecommendations(
      state.availablePlayers,
      state.leagueSettings,
      rosterSlots,
      state.bpaVsNeedWeight,
      state.availablePlayers.length,
    );
  }, [state]);
}
