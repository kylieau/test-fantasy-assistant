import type { Recommendation } from '../../engine/types';
import { STRATEGY_LABELS, type DraftStrategy } from '../../domain/strategy';
import { OppDraftedControl, type TeamOption } from '../OppDraftedControl';

export function RecommendationPanel({
  strategy,
  recommendation,
  teams,
  hasProjections,
  showActions,
  onDraft,
  onMarkDraftedByTeam,
}: {
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
        <div className="recommendation-panel__top">
          <div className="recommendation-panel__top-player">
            <strong>{recommendation.player.name}</strong>
            <span>
              {recommendation.player.position[0]} · {recommendation.player.team}
            </span>
          </div>
          <ul className="recommendation-panel__reasons">
            {recommendation.reasonParts.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {showActions && (
            <div className="recommendation-panel__actions">
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
            </div>
          )}
        </div>
      ) : (
        <p>
          {hasProjections
            ? 'No players left to recommend.'
            : "Couldn't load player projections for this draft — showing a live tracker only."}
        </p>
      )}
    </section>
  );
}
