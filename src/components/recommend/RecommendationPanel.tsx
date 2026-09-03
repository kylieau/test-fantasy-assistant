import type { Recommendation } from '../../engine/types';
import type { FuturePickProjection } from '../../engine/projection';
import { STRATEGY_LABELS, type DraftStrategy } from '../../domain/strategy';

export function RecommendationPanel({
  strategy,
  recommendation,
  futurePicks,
  onDraft,
}: {
  strategy: DraftStrategy;
  recommendation: Recommendation | undefined;
  futurePicks: FuturePickProjection[];
  onDraft: (playerId: string) => void;
}) {
  return (
    <section className="recommendation-panel">
      <h2>Your Next Pick</h2>
      <p className="recommendation-panel__strategy">Strategy: {STRATEGY_LABELS[strategy]}</p>

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
          <button
            type="button"
            className="primary-button"
            onClick={() => onDraft(recommendation.player.id)}
          >
            Draft {recommendation.player.name}
          </button>
        </div>
      ) : (
        <p>No players left to recommend.</p>
      )}

      {futurePicks.length > 0 && (
        <div className="recommendation-panel__future">
          <h3>Anticipated Next Rounds</h3>
          <p className="recommendation-panel__future-caveat">
            Projected assuming other teams draft by ADP — not a guarantee.
          </p>
          <ol>
            {futurePicks.map((fp) => (
              <li key={fp.pickNumber}>
                Pick {fp.pickNumber} (Rd {fp.round}): <strong>{fp.player.name}</strong> (
                {fp.player.position[0]})
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
