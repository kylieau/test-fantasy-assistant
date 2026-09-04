import { useDraft } from '../../state/DraftContext';
import { analyzeRoster, summarizeRoster } from '../../engine/rosterAnalysis';
import { computeFilledRosterSlots } from '../../domain/roster';
import { POSITION_COLORS } from '../positionColors';
import { TeamRosterCard } from './TeamRosterCard';

export function MyRosterView() {
  const { state } = useDraft();
  if (!state) return null;

  const { leagueSettings } = state;

  if (!leagueSettings.hasProjections) {
    return (
      <div className="my-roster">
        <section className="roster-analysis">
          <h2>Team Analysis</h2>
          <p className="roster-analysis__empty">
            Team analysis needs player projections, which couldn't be loaded for this draft.
          </p>
        </section>
        <TeamRosterCard title="My Roster" rosterSlots={leagueSettings.rosterSlots} roster={state.userRoster} />
      </div>
    );
  }

  const filledSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, state.userRoster);
  const analysis = analyzeRoster(state.userRoster, state.availablePlayers, leagueSettings);
  const summary = summarizeRoster(analysis, filledSlots, state.availablePlayers, leagueSettings);

  return (
    <div className="my-roster">
      <section className="roster-analysis">
        <h2>Team Analysis</h2>
        <p className="roster-analysis__summary">{summary}</p>

        <div className="roster-analysis__totals">
          <div className="roster-analysis__stat">
            <span className="roster-analysis__stat-value">{analysis.totalProjectedPoints.toFixed(1)}</span>
            <span className="roster-analysis__stat-label">Total Projected Points</span>
          </div>
          <div className="roster-analysis__stat">
            <span className="roster-analysis__stat-value">
              {analysis.totalValue >= 0 ? '+' : ''}
              {analysis.totalValue.toFixed(1)}
            </span>
            <span className="roster-analysis__stat-label">Total Value Over Replacement</span>
          </div>
        </div>

        {analysis.positionSummaries.length > 0 && (
          <>
            <h3>By Position</h3>
            <table className="roster-analysis__table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Players</th>
                  <th>Proj Pts</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {analysis.positionSummaries.map((summaryRow) => (
                  <tr key={summaryRow.position}>
                    <td>
                      <span
                        className="position-badge"
                        style={{ backgroundColor: POSITION_COLORS[summaryRow.position] }}
                      >
                        {summaryRow.position}
                      </span>
                    </td>
                    <td>{summaryRow.count}</td>
                    <td>{summaryRow.totalProjectedPoints.toFixed(1)}</td>
                    <td>
                      {summaryRow.totalValue >= 0 ? '+' : ''}
                      {summaryRow.totalValue.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {analysis.byeWeekConflicts.length > 0 && (
          <div className="roster-analysis__byes">
            <h3>Bye Week Conflicts</h3>
            <ul>
              {analysis.byeWeekConflicts.map((conflict) => (
                <li key={conflict.week}>
                  Week {conflict.week}: {conflict.players.map((p) => p.name).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <TeamRosterCard title="My Roster" rosterSlots={leagueSettings.rosterSlots} roster={state.userRoster} />
    </div>
  );
}
