import type { DraftState } from '../../domain/draft';
import { computeFilledRosterSlots } from '../../domain/roster';
import { ALL_STRATEGIES, STRATEGY_LABELS, resolveStrategyWeight, type DraftStrategy } from '../../domain/strategy';
import { rankRecommendations } from '../../engine/recommend';
import type { Recommendation } from '../../engine/types';

interface Suggestion {
  strategy: DraftStrategy;
  top: Recommendation;
}

/** Shows what each of the *other* named strategies would suggest right now, as a sanity check. */
export function AlsoConsiderPanel({
  state,
  onDraft,
}: {
  state: DraftState;
  onDraft: (playerId: string) => void;
}) {
  const rosterSlots = computeFilledRosterSlots(state.leagueSettings.rosterSlots, state.userRoster);
  const otherStrategies = ALL_STRATEGIES.filter((s) => s !== state.strategy);

  const suggestions: Suggestion[] = [];
  for (const strategy of otherStrategies) {
    const weight = resolveStrategyWeight(strategy, rosterSlots);
    const [top] = rankRecommendations(state.availablePlayers, state.leagueSettings, rosterSlots, weight, 1);
    if (top) suggestions.push({ strategy, top });
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="also-consider">
      <h2>Also Consider</h2>
      <ul>
        {suggestions.map(({ strategy, top }) => (
          <li key={strategy}>
            <span>
              <strong>{top.player.name}</strong> ({top.player.position[0]}) — best under &ldquo;
              {STRATEGY_LABELS[strategy]}&rdquo;
            </span>
            <button type="button" onClick={() => onDraft(top.player.id)}>
              Draft
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
