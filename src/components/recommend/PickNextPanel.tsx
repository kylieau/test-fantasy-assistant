import type { Recommendation } from '../../engine/types';
import { labelAdpDelta } from '../../engine/value';
import { OppDraftedControl, type TeamOption } from '../OppDraftedControl';

/**
 * Pure best-player-left, independent of the active strategy — a quick "if I ignore roster
 * need entirely, who's the highest-ranked player still on the board" cross-check. The
 * strategy-aware pick lives in the Strategy panel instead.
 */
export function PickNextPanel({
  recommendations,
  teams,
  showActions,
  onDraft,
  onMarkDraftedByTeam,
}: {
  recommendations: Recommendation[];
  teams: TeamOption[];
  showActions: boolean;
  onDraft: (playerId: string) => void;
  onMarkDraftedByTeam: (playerId: string, teamId: string) => void;
}) {
  const [top, ...then] = recommendations;
  if (!top) return null;

  const isBestValue = labelAdpDelta(top.adpDelta) === 'steal';

  return (
    <section className="pick-next-panel">
      <div className="pick-next-panel__heading">
        <h2>Pick Next</h2>
        <span className="pick-next-panel__subtitle">best player left, by ranking</span>
      </div>

      <div className="pick-next-panel__top">
        <div className="pick-next-panel__player">
          <strong>{top.player.name}</strong>
          <span className="pick-next-panel__meta">
            {top.player.position[0]} · {top.player.team}
          </span>
          {isBestValue && (
            <span className="badge badge--value">
              Best value · going {Math.round(top.adpDelta)} picks past his rank
            </span>
          )}
        </div>
        {showActions && (
          <div className="recommendation-panel__actions">
            <button type="button" className="primary-button" onClick={() => onDraft(top.player.id)}>
              + My Team
            </button>
            <OppDraftedControl
              teams={teams}
              onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(top.player.id, teamId)}
              compact
            />
          </div>
        )}
      </div>

      {then.length > 0 && (
        <div className="pick-next-panel__then">
          <span className="pick-next-panel__then-label">then</span>
          <ul>
            {then.map((rec) => (
              <li key={rec.player.id}>
                {rec.player.name} <span className="pick-next-panel__then-pos">{rec.player.position[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
