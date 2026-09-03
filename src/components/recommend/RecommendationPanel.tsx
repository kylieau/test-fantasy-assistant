import type { Recommendation } from '../../engine/types';
import { BpaNeedSlider } from './BpaNeedSlider';

export function RecommendationPanel({
  recommendations,
  weight,
  onWeightChange,
  onDraft,
}: {
  recommendations: Recommendation[];
  weight: number;
  onWeightChange: (weight: number) => void;
  onDraft: (playerId: string) => void;
}) {
  const [top, ...alternates] = recommendations;

  return (
    <section className="recommendation-panel">
      <h2>Who should I take?</h2>
      <BpaNeedSlider weight={weight} onChange={onWeightChange} />

      {top ? (
        <div className="recommendation-panel__top">
          <div className="recommendation-panel__top-player">
            <strong>{top.player.name}</strong>
            <span>
              {top.player.position[0]} · {top.player.team}
            </span>
          </div>
          <ul className="recommendation-panel__reasons">
            {top.reasonParts.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <button type="button" className="primary-button" onClick={() => onDraft(top.player.id)}>
            Draft {top.player.name}
          </button>
        </div>
      ) : (
        <p>No players left to recommend.</p>
      )}

      {alternates.length > 0 && (
        <ol className="recommendation-panel__alternates">
          {alternates.slice(0, 4).map((rec) => (
            <li key={rec.player.id}>
              <span>
                {rec.player.name} ({rec.player.position[0]})
              </span>
              <button type="button" onClick={() => onDraft(rec.player.id)}>
                Draft
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
