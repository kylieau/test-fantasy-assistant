import { useDraft } from '../../state/DraftContext';
import { useRecommendations } from '../../state/useRecommendations';
import { usePositionRanksAndTiers } from '../../state/usePositionRanksAndTiers';
import { projectFuturePicks, upcomingUserPickNumbers } from '../../engine/projection';
import type { Recommendation } from '../../engine/types';
import { RecommendationPanel } from '../recommend/RecommendationPanel';
import { AlsoConsiderPanel } from '../recommend/AlsoConsiderPanel';
import { RosterNeedsView } from '../roster/RosterNeedsView';
import { PlayerTable } from './PlayerTable';

const FUTURE_PICKS_TO_SHOW = 3;

export function DraftBoard() {
  const { state, draftPlayer, toggleFavorite } = useDraft();
  const recommendations = useRecommendations(state); // [] automatically when !hasProjections
  const { positionRanks, tiers } = usePositionRanksAndTiers(state);

  if (!state) return null;

  const { leagueSettings } = state;
  const hasProjections = leagueSettings.hasProjections;
  // Sleeper stays authoritative for the actual pick regardless of hasProjections — the user
  // decides here, then executes the pick on the other device/platform.
  const showActions = leagueSettings.platform === 'manual';

  const nextUserPickNumber =
    upcomingUserPickNumbers(leagueSettings, state.currentPick, state.userTeamId, 1)[0] ?? null;

  const futurePicks = hasProjections
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
  const markDraftedByTeam = (playerId: string, teamId: string) => draftPlayer(playerId, teamId);

  // Tracker-only rows: no real projections to rank by, so the table just lists players
  // (Name/Pos/Team/Bye) rather than pretending zeroed values mean anything.
  const trackerOnlyRows: Recommendation[] = hasProjections
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

      <RecommendationPanel
        strategy={state.strategy}
        recommendation={recommendations[0]}
        futurePicks={futurePicks}
        teams={otherTeams}
        hasProjections={hasProjections}
        showActions={showActions}
        onDraft={draftToMyTeam}
        onMarkDraftedByTeam={markDraftedByTeam}
      />
      <AlsoConsiderPanel
        state={state}
        excludePlayerId={recommendations[0]?.player.id}
        teams={otherTeams}
        showActions={showActions}
        onDraftToMyTeam={draftToMyTeam}
        onMarkDraftedByTeam={markDraftedByTeam}
      />

      <PlayerTable
        recommendations={hasProjections ? recommendations : trackerOnlyRows}
        positionRanks={positionRanks}
        tiers={tiers}
        favoritedPlayerIds={state.favoritedPlayerIds}
        nextUserPickNumber={nextUserPickNumber}
        teams={otherTeams}
        onDraftToMyTeam={draftToMyTeam}
        onMarkDraftedByTeam={markDraftedByTeam}
        onToggleFavorite={toggleFavorite}
        showValueColumns={hasProjections}
        showActions={showActions}
      />
    </div>
  );
}
