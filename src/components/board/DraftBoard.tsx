import { useState } from 'react';
import { useDraft } from '../../state/DraftContext';
import { useRecommendations } from '../../state/useRecommendations';
import { opponentTeamIds, USER_TEAM_ID } from '../../domain/draft';
import { computeFilledRosterSlots } from '../../domain/roster';
import { RecommendationPanel } from '../recommend/RecommendationPanel';
import { RosterNeedsView } from '../roster/RosterNeedsView';
import { PlayerTable } from './PlayerTable';

export function DraftBoard() {
  const { state, draftPlayer, setWeight } = useDraft();
  const recommendations = useRecommendations(state);
  const [actingTeamId, setActingTeamId] = useState<string>(USER_TEAM_ID);

  if (!state) return null;

  const rosterSlots = computeFilledRosterSlots(state.leagueSettings.rosterSlots, state.userRoster);
  const opponents = opponentTeamIds(state.leagueSettings);

  return (
    <div className="draft-board">
      <div className="draft-board__top">
        <RecommendationPanel
          recommendations={recommendations.slice(0, 5)}
          weight={state.bpaVsNeedWeight}
          onWeightChange={setWeight}
          onDraft={(playerId) => draftPlayer(playerId, state.userTeamId)}
        />
        <RosterNeedsView rosterSlots={rosterSlots} />
      </div>

      <div className="draft-board__acting-team">
        <label>
          Mark next pick as drafted by:
          <select value={actingTeamId} onChange={(e) => setActingTeamId(e.target.value)}>
            <option value={state.userTeamId}>Me</option>
            {opponents.map((id, i) => (
              <option key={id} value={id}>
                Opponent {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PlayerTable recommendations={recommendations} onDraft={(playerId) => draftPlayer(playerId, actingTeamId)} />
    </div>
  );
}
