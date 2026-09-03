import type { Player, Position } from '../domain/player';
import type { LeagueSettings, RosterSlot } from '../domain/roster';
import { computeReplacementLevels } from './replacementLevel';
import { computeValue } from './value';

const REAL_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

/** Average value-per-drafted-player thresholds for the plain-language strength descriptor. */
const STRONG_AVG_VALUE = 20;
const SOLID_AVG_VALUE = 0;

export interface PositionSummary {
  position: Position;
  count: number;
  totalProjectedPoints: number;
  /** Sum of each player's value over the *current* replacement level at their position. */
  totalValue: number;
}

export interface ByeWeekConflict {
  week: number;
  players: Player[];
}

export interface RosterAnalysis {
  totalProjectedPoints: number;
  totalValue: number;
  positionSummaries: PositionSummary[];
  byeWeekConflicts: ByeWeekConflict[];
}

/**
 * Summarizes a drafted roster using the same VBD value model the recommendation engine
 * uses (computeReplacementLevels/computeValue), rather than a raw points total alone —
 * NFL roster strength is about value over replacement, not just cumulative points.
 */
export function analyzeRoster(
  roster: Player[],
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
): RosterAnalysis {
  const replacementLevels = computeReplacementLevels(availablePlayers, leagueSettings);

  const byPosition = new Map<Position, Player[]>();
  for (const player of roster) {
    const position = player.position[0];
    const list = byPosition.get(position);
    if (list) {
      list.push(player);
    } else {
      byPosition.set(position, [player]);
    }
  }

  const positionSummaries: PositionSummary[] = [...byPosition.entries()].map(([position, players]) => ({
    position,
    count: players.length,
    totalProjectedPoints: players.reduce((sum, p) => sum + p.projected_points, 0),
    totalValue: players.reduce((sum, p) => sum + computeValue(p, replacementLevels), 0),
  }));
  positionSummaries.sort((a, b) => b.totalValue - a.totalValue);

  const byeWeekGroups = new Map<number, Player[]>();
  for (const player of roster) {
    if (player.bye_week == null) continue;
    const list = byeWeekGroups.get(player.bye_week);
    if (list) {
      list.push(player);
    } else {
      byeWeekGroups.set(player.bye_week, [player]);
    }
  }
  const byeWeekConflicts: ByeWeekConflict[] = [...byeWeekGroups.entries()]
    .filter(([, players]) => players.length >= 2)
    .map(([week, players]) => ({ week, players }))
    .sort((a, b) => a.week - b.week);

  return {
    totalProjectedPoints: roster.reduce((sum, p) => sum + p.projected_points, 0),
    totalValue: positionSummaries.reduce((sum, s) => sum + s.totalValue, 0),
    positionSummaries,
    byeWeekConflicts,
  };
}

/**
 * Plain-language, 3-4 sentence read on the roster: how strong it is so far, where its value
 * is concentrated, which specific positions still need help, and how much of the roster is
 * left to fill — cross-referenced against the players still actually on the board rather
 * than positions in the abstract. The strength labels (strong/solid/below-replacement) are a
 * documented simplification based on average value-over-replacement per player drafted.
 */
export function summarizeRoster(
  analysis: RosterAnalysis,
  filledSlots: RosterSlot[],
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
): string {
  const draftedCount = analysis.positionSummaries.reduce((sum, s) => sum + s.count, 0);
  if (draftedCount === 0) {
    return 'No players drafted yet — your team analysis will appear here once you make your first pick.';
  }

  const sentences: string[] = [];

  const avgValue = analysis.totalValue / draftedCount;
  const strengthDescriptor =
    avgValue >= STRONG_AVG_VALUE ? 'strong' : avgValue >= SOLID_AVG_VALUE ? 'solid' : 'below-replacement-level';
  sentences.push(
    `Overall, this is a ${strengthDescriptor} roster so far, averaging ${avgValue >= 0 ? '+' : ''}${avgValue.toFixed(1)} points of value over replacement per player drafted.`,
  );

  const best = analysis.positionSummaries[0];
  sentences.push(
    `The clearest strength is at ${best.position}, where ${best.count} player${best.count > 1 ? 's contribute' : ' contributes'} ${best.totalValue >= 0 ? '+' : ''}${best.totalValue.toFixed(1)} points of value over replacement.`,
  );

  const openPositions = REAL_POSITIONS.filter((position) => {
    const slot = filledSlots.find((s) => s.position === position);
    return slot ? slot.filled < slot.count : false;
  });

  if (openPositions.length > 0) {
    const replacementLevels = computeReplacementLevels(availablePlayers, leagueSettings);
    const needs = openPositions.slice(0, 2).map((position) => {
      const bestAvailable = availablePlayers
        .filter((p) => p.position.includes(position))
        .sort((a, b) => b.projected_points - a.projected_points)[0];
      if (!bestAvailable) return `${position} (no players remain at this position)`;
      const value = computeValue(bestAvailable, replacementLevels);
      return `${position} (${bestAvailable.name} is the top player left, ${value >= 0 ? '+' : ''}${value.toFixed(1)} value)`;
    });
    sentences.push(`The biggest opportunities to improve are ${needs.join(' and ')}.`);
  } else {
    sentences.push('All starting positions are currently filled, so future picks are purely about depth.');
  }

  const totalSlots = filledSlots.reduce((sum, s) => sum + s.count, 0);
  const filledSlotCount = filledSlots.reduce((sum, s) => sum + s.filled, 0);
  const remaining = totalSlots - filledSlotCount;
  sentences.push(
    `With ${filledSlotCount} of ${totalSlots} roster spots filled, there ${remaining === 1 ? 'is' : 'are'} ${remaining} pick${remaining === 1 ? '' : 's'} left to round out the team.`,
  );

  return sentences.join(' ');
}
