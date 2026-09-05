import { useMemo } from 'react';
import type { DraftState } from '../../domain/draft';
import { computeFilledRosterSlots } from '../../domain/roster';
import {
  playersLikelyAvailableAt,
  totalRosterSlotCount,
  upcomingUserPickNumbers,
} from '../../engine/projection';
import { summarizeRoundNeed } from '../../engine/roundPlan';
import { POSITION_COLORS } from '../positionColors';

/** How many candidate names to show for "likely still there at your next pick." */
const LIKELY_STILL_THERE_COUNT = 4;

/**
 * Full round-by-round view of every pick the user has made or will make, plus a shortlist of
 * players likely to survive to their very next turn — the "YOUR DRAFT" panel. Complements
 * PickNextPanel/RecommendationPanel (which only cover the single upcoming pick) by showing the
 * whole arc of the draft at a glance.
 */
export function RoundPlanner({ state }: { state: DraftState }) {
  const { leagueSettings, userRoster, strategy, currentPick, userTeamId, availablePlayers, picksMade } = state;

  const remainingSlots = Math.max(0, totalRosterSlotCount(leagueSettings) - userRoster.length);
  const pastUserPickNumbers = picksMade.filter((p) => p.teamId === userTeamId).map((p) => p.pickNumber);
  const futureUserPickNumbers = upcomingUserPickNumbers(leagueSettings, currentPick, userTeamId, remainingSlots);
  const allUserPickNumbers = [...pastUserPickNumbers, ...futureUserPickNumbers].sort((a, b) => a - b);

  const nextPick = futureUserPickNumbers[0];
  const nextRound = nextPick !== undefined ? Math.floor((nextPick - 1) / leagueSettings.teamCount) + 1 : null;

  const roundPlanLabel = useMemo(() => {
    if (nextPick === undefined || !leagueSettings.hasProjections) return null;
    const rosterSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, userRoster);
    return summarizeRoundNeed(rosterSlots);
  }, [nextPick, leagueSettings, userRoster]);

  const likelyStillThere = useMemo(() => {
    if (nextPick === undefined || !leagueSettings.hasProjections) return [];
    return playersLikelyAvailableAt(
      availablePlayers,
      leagueSettings,
      userRoster,
      strategy,
      currentPick,
      userTeamId,
      nextPick,
      LIKELY_STILL_THERE_COUNT,
    );
  }, [nextPick, leagueSettings, availablePlayers, userRoster, strategy, currentPick, userTeamId]);

  if (allUserPickNumbers.length === 0) return null;

  return (
    <section className="round-planner">
      <div className="round-planner__header">
        <h2>Your Draft</h2>
        {nextPick !== undefined && (
          <span className="round-planner__status">
            On the clock: #{currentPick} · you&rsquo;re up in {Math.max(0, nextPick - currentPick)} at #
            {nextPick} (round {nextRound})
          </span>
        )}
        {roundPlanLabel && (
          <span className="round-planner__plan-tag">
            R{nextRound} plan: {roundPlanLabel}
          </span>
        )}
      </div>

      <div className="round-planner__rounds">
        {allUserPickNumbers.map((pickNumber) => {
          const round = Math.floor((pickNumber - 1) / leagueSettings.teamCount) + 1;
          const isPast = pickNumber < currentPick;
          const isNext = pickNumber === nextPick;
          return (
            <span
              key={pickNumber}
              className={
                'round-chip' +
                (isPast ? ' round-chip--past' : '') +
                (isNext ? ' round-chip--next' : '')
              }
            >
              R{round} #{pickNumber}
            </span>
          );
        })}
      </div>

      {likelyStillThere.length > 0 && (
        <div className="round-planner__likely">
          <h3>Likely still there at your pick #{nextPick}</h3>
          <div className="round-planner__likely-players">
            {likelyStillThere.map((player) => (
              <span key={player.id} className="likely-player">
                <span className="position-badge" style={{ backgroundColor: POSITION_COLORS[player.position[0]] }}>
                  {player.position[0]}
                </span>
                {player.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
