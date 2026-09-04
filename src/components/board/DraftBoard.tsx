import { useDraft } from '../../state/DraftContext';
import { useRecommendations } from '../../state/useRecommendations';
import { projectFuturePicks, upcomingUserPickNumbers } from '../../engine/projection';
import { POSITION_RANKS, TIERS } from '../../data/seed/derived';
import type { Recommendation } from '../../engine/types';
import { RecommendationPanel } from '../recommend/RecommendationPanel';
import { AlsoConsiderPanel } from '../recommend/AlsoConsiderPanel';
import { RosterNeedsView } from '../roster/RosterNeedsView';
import { PlayerTable } from './PlayerTable';

const FUTURE_PICKS_TO_SHOW = 3;

export function DraftBoard() {
  const { state, draftPlayer, toggleFavorite } = useDraft();
  const recommendations = useRecommendations(state); // [] automatically when platform !== 'manual'

  if (!state) return null;

  const { leagueSettings } = state;
  const isManual = leagueSettings.platform === 'manual';

  const nextUserPickNumber =
    upcomingUserPickNumbers(leagueSettings, state.currentPick, state.userTeamId, 1)[0] ?? null;

  const futurePicks = isManual
    ? projectFuturePicks(
        state.availablePlayers,
        leagueSettings,
        state.userRoster,
        state.strategy,
        state.currentPick,
        state.userTeamId,
        FUTURE_PICKS_TO_SHOW,
      )
    : [];

  const otherTeams = leagueSettings.draftOrder
    .filter((id) => id !== state.userTeamId)
    .map((id) => ({ id, name: leagueSettings.teamNames[id] ?? id }));

  const userTeamId = state.userTeamId;
  const draftToMyTeam = (playerId: string) => {
    draftPlayer(playerId, userTeamId);
  };

  // Read-only rows: available players with no real projections to rank by, so the table
  // just lists them (Name/Pos/Team/Bye) rather than pretending zeroed values mean anything.
  const readOnlyRows: Recommendation[] = isManual
    ? []
    : state.availablePlayers.map((player) => ({
        player,
        value: 0,
        adpDelta: 0,
        needScore: 0,
        score: 0,
        reasonParts: [],
      }));

  return (
    <div className="draft-board">
      <RosterNeedsView rosterSlots={leagueSettings.rosterSlots} roster={state.userRoster} compact />

      {isManual && (
        <>
          <RecommendationPanel
            strategy={state.strategy}
            recommendation={recommendations[0]}
            futurePicks={futurePicks}
            teams={otherTeams}
            onDraft={draftToMyTeam}
            onMarkDraftedByTeam={(playerId, teamId) => draftPlayer(playerId, teamId)}
          />
          <AlsoConsiderPanel
            state={state}
            excludePlayerId={recommendations[0]?.player.id}
            teams={otherTeams}
            onDraftToMyTeam={draftToMyTeam}
            onMarkDraftedByTeam={(playerId, teamId) => draftPlayer(playerId, teamId)}
          />
        </>
      )}

      <PlayerTable
        recommendations={isManual ? recommendations : readOnlyRows}
        positionRanks={isManual ? POSITION_RANKS : {}}
        tiers={isManual ? TIERS : {}}
        favoritedPlayerIds={state.favoritedPlayerIds}
        nextUserPickNumber={nextUserPickNumber}
        teams={otherTeams}
        onDraftToMyTeam={draftToMyTeam}
        onMarkDraftedByTeam={(playerId, teamId) => draftPlayer(playerId, teamId)}
        onToggleFavorite={toggleFavorite}
        readOnly={!isManual}
      />
    </div>
  );
}
