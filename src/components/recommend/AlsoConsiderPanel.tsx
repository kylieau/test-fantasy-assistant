import type { DraftState } from '../../domain/draft';
import { computeFilledRosterSlots } from '../../domain/roster';
import { ALL_STRATEGIES, STRATEGY_LABELS, resolveStrategyWeight, type DraftStrategy } from '../../domain/strategy';
import { labelAdpDelta } from '../../engine/value';
import { rankRecommendations } from '../../engine/recommend';
import type { Recommendation } from '../../engine/types';
import { PlayerActions, type TeamOption } from '../PlayerActions';

interface Suggestion {
  strategy: DraftStrategy;
  top: Recommendation;
}

/** Strategies are ranked several deep so a distinct alternative can be found per strategy. */
const CANDIDATES_PER_STRATEGY = 5;

/**
 * Shows what each of the *other* named strategies would suggest right now, as a sanity
 * check. Always excludes whichever player is already shown as "Your Next Pick," and never
 * repeats the same player across the listed alternatives.
 */
export function AlsoConsiderPanel({
  state,
  excludePlayerId,
  teams,
  onDraftToMyTeam,
  onMarkDraftedByTeam,
}: {
  state: DraftState;
  excludePlayerId: string | undefined;
  teams: TeamOption[];
  onDraftToMyTeam: (playerId: string) => void;
  onMarkDraftedByTeam: (playerId: string, teamId: string) => void;
}) {
  const rosterSlots = computeFilledRosterSlots(state.leagueSettings.rosterSlots, state.userRoster);
  const otherStrategies = ALL_STRATEGIES.filter((s) => s !== state.strategy);

  const usedPlayerIds = new Set<string>(excludePlayerId ? [excludePlayerId] : []);
  const suggestions: Suggestion[] = [];

  for (const strategy of otherStrategies) {
    const weight = resolveStrategyWeight(strategy, rosterSlots);
    const ranked = rankRecommendations(
      state.availablePlayers,
      state.leagueSettings,
      rosterSlots,
      weight,
      CANDIDATES_PER_STRATEGY,
    );
    const top = ranked.find((r) => !usedPlayerIds.has(r.player.id));
    if (top) {
      suggestions.push({ strategy, top });
      usedPlayerIds.add(top.player.id);
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="also-consider">
      <h2>Also Consider</h2>
      <ul>
        {suggestions.map(({ strategy, top }) => {
          const adpLabel = labelAdpDelta(top.adpDelta);
          return (
            <li key={strategy}>
              <div className="also-consider__info">
                <span className="also-consider__headline">
                  <strong>{top.player.name}</strong> ({top.player.position[0]}) — best under &ldquo;
                  {STRATEGY_LABELS[strategy]}&rdquo;
                </span>
                <span className="also-consider__stats">
                  {top.player.projected_points.toFixed(1)} pts · {top.value >= 0 ? '+' : ''}
                  {top.value.toFixed(1)} value ·{' '}
                  <span className={adpLabel !== 'neutral' ? `adp-label--${adpLabel}` : undefined}>
                    ADP {top.player.adp}
                  </span>
                </span>
              </div>
              <PlayerActions
                teams={teams}
                onDraftToMyTeam={() => onDraftToMyTeam(top.player.id)}
                onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(top.player.id, teamId)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
