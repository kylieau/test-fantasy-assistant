import type { DraftState } from '../../domain/draft';
import { computeFilledRosterSlots } from '../../domain/roster';
import { ALL_STRATEGIES, STRATEGY_LABELS, resolveStrategyWeight, type DraftStrategy } from '../../domain/strategy';
import { rankRecommendations } from '../../engine/recommend';
import type { Recommendation } from '../../engine/types';
import { PlayerCard } from '../PlayerCard';
import { PlayerActions, type TeamOption } from '../PlayerActions';

interface Suggestion {
  strategy: DraftStrategy;
  top: Recommendation;
}

/** Strategies are ranked several deep so a distinct alternative can be found per strategy. */
const CANDIDATES_PER_STRATEGY = 5;

/**
 * Shows what each of the *other* named strategies would suggest right now, as a sanity
 * check, nested under the Strategy panel as a compact card row (same treatment as Pick
 * Next's "then" preview). Always excludes whichever player is already shown as the top
 * Strategy pick, and never repeats the same player across the listed alternatives.
 */
export function AlsoConsiderPanel({
  state,
  excludePlayerId,
  teams,
  showActions,
  onDraftToMyTeam,
  onMarkDraftedByTeam,
}: {
  state: DraftState;
  excludePlayerId: string | undefined;
  teams: TeamOption[];
  /** Sleeper stays authoritative for the actual pick — hide the draft controls there. */
  showActions: boolean;
  onDraftToMyTeam: (playerId: string) => void;
  onMarkDraftedByTeam: (playerId: string, teamId: string) => void;
}) {
  if (!state.leagueSettings.hasProjections) return null;

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
    <div className="panel-subsection">
      <span className="panel-subsection__label">also consider</span>
      <div className="panel-subsection__cards">
        {suggestions.map(({ strategy, top }) => (
          <PlayerCard
            key={strategy}
            compact
            player={top.player}
            stats={{ points: top.player.projected_points, value: top.value, adp: top.player.adp }}
            reasonParts={[`Best under "${STRATEGY_LABELS[strategy]}"`]}
            actions={
              showActions && (
                <PlayerActions
                  teams={teams}
                  onDraftToMyTeam={() => onDraftToMyTeam(top.player.id)}
                  onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(top.player.id, teamId)}
                />
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
