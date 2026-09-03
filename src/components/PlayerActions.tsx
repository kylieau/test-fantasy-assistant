import { OppDraftedControl, type TeamOption } from './OppDraftedControl';

export type { TeamOption };

/**
 * Shared per-player action control: add to the user's own team, or flag as drafted by a
 * specific opponent. Used anywhere a single player row/card needs draft actions (the
 * Available Players table, Also Consider) so the interaction stays consistent everywhere.
 */
export function PlayerActions({
  teams,
  onDraftToMyTeam,
  onMarkDraftedByTeam,
}: {
  teams: TeamOption[];
  onDraftToMyTeam: () => void;
  onMarkDraftedByTeam: (teamId: string) => void;
}) {
  return (
    <div className="player-actions">
      <button type="button" className="player-actions__mine" onClick={onDraftToMyTeam}>
        + My Team
      </button>
      <OppDraftedControl teams={teams} onMarkDraftedByTeam={onMarkDraftedByTeam} />
    </div>
  );
}
