import type { DraftState } from '../../domain/draft';
import type { Recommendation } from '../../engine/types';
import { STRATEGY_LABELS, type DraftStrategy } from '../../domain/strategy';
import { PlayerCard } from '../PlayerCard';
import { OppDraftedControl, type TeamOption } from '../OppDraftedControl';
import { AlsoConsiderPanel } from './AlsoConsiderPanel';

export function RecommendationPanel({
  state,
  strategy,
  recommendation,
  teams,
  hasProjections,
  showActions,
  onDraft,
  onMarkDraftedByTeam,
}: {
  state: DraftState;
  strategy: DraftStrategy;
  recommendation: Recommendation | undefined;
  teams: TeamOption[];
  /** False when there's no usable projection data (e.g. ESPN merge failed for a Sleeper draft). */
  hasProjections: boolean;
  /** Sleeper stays authoritative for the actual pick — hide the draft controls there. */
  showActions: boolean;
  onDraft: (playerId: string) => void;
  onMarkDraftedByTeam: (playerId: string, teamId: string) => void;
}) {
  return (
    <section className="recommendation-panel">
      <h2>Strategy</h2>
      <p className="recommendation-panel__strategy">
        Who to consider for your roster &amp; round — {STRATEGY_LABELS[strategy]}
      </p>

      {recommendation ? (
        <PlayerCard
          player={recommendation.player}
          stats={{
            points: recommendation.player.projected_points,
            value: recommendation.value,
            adp: recommendation.player.adp,
          }}
          reasonParts={recommendation.reasonParts}
          actions={
            showActions && (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onDraft(recommendation.player.id)}
                >
                  Draft {recommendation.player.name}
                </button>
                <OppDraftedControl
                  teams={teams}
                  onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(recommendation.player.id, teamId)}
                  compact
                />
              </>
            )
          }
        />
      ) : (
        <p>
          {hasProjections
            ? 'No players left to recommend.'
            : "Couldn't load player projections for this draft — showing a live tracker only."}
        </p>
      )}

      <AlsoConsiderPanel
        state={state}
        excludePlayerId={recommendation?.player.id}
        teams={teams}
        showActions={showActions}
        onDraftToMyTeam={onDraft}
        onMarkDraftedByTeam={onMarkDraftedByTeam}
      />
    </section>
  );
}
