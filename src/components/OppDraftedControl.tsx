import { useState } from 'react';

export interface TeamOption {
  id: string;
  name: string;
}

/**
 * Toggle + team-select for flagging a player as drafted by a specific opponent. Extracted
 * so both PlayerActions (paired with "+ My Team") and RecommendationPanel (paired with the
 * larger "Draft [Player]" button) can reuse the same behavior at different sizes.
 */
export function OppDraftedControl({
  teams,
  onMarkDraftedByTeam,
  compact = false,
}: {
  teams: TeamOption[];
  onMarkDraftedByTeam: (teamId: string) => void;
  compact?: boolean;
}) {
  const [oppDrafted, setOppDrafted] = useState(false);

  return (
    <div className={`opp-drafted-control ${compact ? 'opp-drafted-control--compact' : ''}`}>
      <button
        type="button"
        className={`player-actions__opp-toggle ${oppDrafted ? 'player-actions__opp-toggle--active' : ''} ${
          compact ? 'player-actions__opp-toggle--compact' : ''
        }`}
        onClick={() => setOppDrafted((v) => !v)}
        aria-pressed={oppDrafted}
      >
        Opp Drafted
      </button>
      {oppDrafted && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onMarkDraftedByTeam(e.target.value);
          }}
        >
          <option value="">Select team…</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
