import { useDraft } from '../../state/DraftContext';
import { RosterNeedsView } from '../roster/RosterNeedsView';

export function AllRostersView() {
  const { state } = useDraft();
  if (!state) return null;

  const { leagueSettings } = state;

  return (
    <div className="all-rosters">
      {leagueSettings.draftOrder.map((teamId) => {
        const roster = teamId === state.userTeamId ? state.userRoster : state.opponentRosters[teamId] ?? [];
        const name = leagueSettings.teamNames[teamId] ?? teamId;
        return (
          <RosterNeedsView key={teamId} title={name} rosterSlots={leagueSettings.rosterSlots} roster={roster} />
        );
      })}
    </div>
  );
}
