import type { Recommendation } from '../../engine/types';
import { labelAdpDelta } from '../../engine/value';
import { PlayerCard } from '../PlayerCard';
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

      <PlayerCard
        player={top.player}
        stats={{ points: top.player.projected_points, value: top.value, adp: top.player.adp }}
        reasonParts={top.reasonParts}
        badge={isBestValue ? `Best value · going ${Math.round(top.adpDelta)} picks past his rank` : undefined}
        actions={
          showActions && (
            <>
              <button type="button" className="primary-button" onClick={() => onDraft(top.player.id)}>
                + My Team
              </button>
              <OppDraftedControl
                teams={teams}
                onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(top.player.id, teamId)}
                compact
              />
            </>
          )
        }
      />

      {then.length > 0 && (
        <div className="pick-next-panel__then">
          <span className="pick-next-panel__then-label">then</span>
          <div className="pick-next-panel__then-cards">
            {then.map((rec) => (
              <PlayerCard
                key={rec.player.id}
                compact
                player={rec.player}
                stats={{ points: rec.player.projected_points, value: rec.value, adp: rec.player.adp }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
