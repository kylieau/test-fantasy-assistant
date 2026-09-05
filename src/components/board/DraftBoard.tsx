import { useDraft } from '../../state/DraftContext';
import { useRecommendations } from '../../state/useRecommendations';
import { usePositionRanksAndTiers } from '../../state/usePositionRanksAndTiers';
import { computeFilledRosterSlots } from '../../domain/roster';
import { computeReplacementLevels } from '../../engine/replacementLevel';
import { computeAdpDelta, computeValue } from '../../engine/value';
import { rankRecommendations } from '../../engine/recommend';
import { upcomingUserPickNumbers } from '../../engine/projection';
import type { Recommendation } from '../../engine/types';
import { RoundPlanner } from './RoundPlanner';
import { PickNextPanel } from '../recommend/PickNextPanel';
import { RecommendationPanel } from '../recommend/RecommendationPanel';
import { RosterNeedsView } from '../roster/RosterNeedsView';
import { PlayerTable } from './PlayerTable';

/** How many players deep the pure-BPA "Pick Next" list goes (top pick + a short "then" preview). */
const PICK_NEXT_DEPTH = 6;

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

  const rosterSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, state.userRoster);

  const nextUserPickNumber =
    upcomingUserPickNumbers(leagueSettings, state.currentPick, state.userTeamId, 1)[0] ?? null;

  // Pure best-player-available, independent of the active strategy — "Strategy" (below) is
  // where the chosen strategy's roster/need-aware pick lives instead.
  const pickNextRecommendations = hasProjections
    ? rankRecommendations(state.availablePlayers, leagueSettings, rosterSlots, 0, PICK_NEXT_DEPTH)
    : [];

  const otherTeams = leagueSettings.draftOrder
    .filter((id) => id !== state.userTeamId)
    .map((id) => ({ id, name: leagueSettings.teamNames[id] ?? id }));

  const userTeamId = state.userTeamId;
  const draftToMyTeam = (playerId: string) => {
    draftPlayer(playerId, userTeamId);
  };
  const markDraftedByTeam = (playerId: string, teamId: string) => draftPlayer(playerId, teamId);

  // Drafted players stay visible in the Available Players table (greyed out, tagged with who
  // took them) instead of disappearing, so the table doubles as a draft history view.
  const replacementLevels = hasProjections
    ? computeReplacementLevels(state.availablePlayers, leagueSettings)
    : {};
  const draftedRows: Recommendation[] = state.picksMade.map((pick) => ({
    player: pick.player,
    value: hasProjections ? computeValue(pick.player, replacementLevels) : 0,
    adpDelta: hasProjections ? computeAdpDelta(pick.player) : 0,
    needScore: 0,
    score: 0,
    reasonParts: [],
    draftedBy: pick.teamId === userTeamId ? 'You' : (leagueSettings.teamNames[pick.teamId] ?? pick.teamId),
  }));

  // Tracker-only rows: no real projections to rank by, so the table just lists players
  // (Name/Pos/Team/Bye) rather than pretending zeroed values mean anything.
  const availableRows: Recommendation[] = hasProjections
    ? recommendations
    : state.availablePlayers.map((player) => ({
        player,
        value: 0,
        adpDelta: 0,
        needScore: 0,
        score: 0,
        reasonParts: [],
      }));

  const tableRows = [...availableRows, ...draftedRows];

  return (
    <div className="draft-board">
      <RosterNeedsView rosterSlots={leagueSettings.rosterSlots} roster={state.userRoster} compact />

      <RoundPlanner state={state} />

      {hasProjections && (
        <PickNextPanel
          recommendations={pickNextRecommendations}
          teams={otherTeams}
          showActions={showActions}
          onDraft={draftToMyTeam}
          onMarkDraftedByTeam={markDraftedByTeam}
        />
      )}

      <RecommendationPanel
        state={state}
        strategy={state.strategy}
        recommendation={recommendations[0]}
        teams={otherTeams}
        hasProjections={hasProjections}
        showActions={showActions}
        onDraft={draftToMyTeam}
        onMarkDraftedByTeam={markDraftedByTeam}
      />

      <PlayerTable
        recommendations={tableRows}
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
