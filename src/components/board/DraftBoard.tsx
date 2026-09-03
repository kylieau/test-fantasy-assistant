import { useDraft } from '../../state/DraftContext';
import { useRecommendations } from '../../state/useRecommendations';
import { projectFuturePicks, upcomingUserPickNumbers } from '../../engine/projection';
import { POSITION_RANKS, TIERS } from '../../data/seed/derived';
import { RecommendationPanel } from '../recommend/RecommendationPanel';
import { AlsoConsiderPanel } from '../recommend/AlsoConsiderPanel';
import { RosterNeedsView } from '../roster/RosterNeedsView';
import { PlayerTable } from './PlayerTable';

const FUTURE_PICKS_TO_SHOW = 3;

export function DraftBoard() {
  const { state, draftPlayer, toggleFavorite } = useDraft();
  const recommendations = useRecommendations(state);

  if (!state) return null;

  const { leagueSettings } = state;

  const nextUserPickNumber =
    upcomingUserPickNumbers(leagueSettings, state.currentPick, state.userTeamId, 1)[0] ?? null;

  const futurePicks = projectFuturePicks(
    state.availablePlayers,
    leagueSettings,
    state.userRoster,
    state.strategy,
    state.currentPick,
    state.userTeamId,
    FUTURE_PICKS_TO_SHOW,
  );

  const otherTeams = leagueSettings.draftOrder
    .filter((id) => id !== state.userTeamId)
    .map((id) => ({ id, name: leagueSettings.teamNames[id] ?? id }));

  const userTeamId = state.userTeamId;
  const draftToMyTeam = (playerId: string) => {
    draftPlayer(playerId, userTeamId);
  };

  return (
    <div className="draft-board">
      <div className="draft-board__top">
        <div className="draft-board__top-main">
          <RecommendationPanel
            strategy={state.strategy}
            recommendation={recommendations[0]}
            futurePicks={futurePicks}
            onDraft={draftToMyTeam}
          />
          <AlsoConsiderPanel state={state} onDraft={draftToMyTeam} />
        </div>
        <RosterNeedsView rosterSlots={leagueSettings.rosterSlots} roster={state.userRoster} />
      </div>

      <PlayerTable
        recommendations={recommendations}
        positionRanks={POSITION_RANKS}
        tiers={TIERS}
        favoritedPlayerIds={state.favoritedPlayerIds}
        nextUserPickNumber={nextUserPickNumber}
        teams={otherTeams}
        onDraftToMyTeam={draftToMyTeam}
        onMarkDraftedByTeam={(playerId, teamId) => draftPlayer(playerId, teamId)}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
