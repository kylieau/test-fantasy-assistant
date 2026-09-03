import type { RosterSlot } from './roster';

export type DraftStrategy = 'bpa' | 'need' | 'balanced' | 'bpa_then_need_80';

export const ALL_STRATEGIES: DraftStrategy[] = ['bpa', 'need', 'balanced', 'bpa_then_need_80'];

export const STRATEGY_LABELS: Record<DraftStrategy, string> = {
  bpa: 'Best Player Available',
  need: 'Fill a Need',
  balanced: 'Balance Best Player Available and Fill a Need',
  bpa_then_need_80: 'Best Player Available, then Fill a Need after 80% rostered',
};

export const STRATEGY_DESCRIPTIONS: Record<DraftStrategy, string> = {
  bpa: 'Always take the highest-value player left on the board.',
  need: 'Always prioritize filling your emptiest roster slots.',
  balanced: 'Equally weigh best player available and roster need.',
  bpa_then_need_80:
    'Take the best player available until 80% of your roster is filled, then draft for need among the best players remaining.',
};

const BPA_THEN_NEED_FILL_THRESHOLD = 0.8;

export function rosterFillFraction(rosterSlots: RosterSlot[]): number {
  const totalSlots = rosterSlots.reduce((sum, slot) => sum + slot.count, 0);
  if (totalSlots === 0) return 0;
  const totalFilled = rosterSlots.reduce((sum, slot) => sum + slot.filled, 0);
  return totalFilled / totalSlots;
}

/** Maps a named strategy to the underlying BPA-vs-need weight the recommendation engine expects. */
export function resolveStrategyWeight(strategy: DraftStrategy, rosterSlots: RosterSlot[]): number {
  switch (strategy) {
    case 'bpa':
      return 0;
    case 'need':
      return 1;
    case 'balanced':
      return 0.5;
    case 'bpa_then_need_80':
      return rosterFillFraction(rosterSlots) >= BPA_THEN_NEED_FILL_THRESHOLD ? 1 : 0;
    default:
      return 0.5;
  }
}
