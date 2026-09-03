import type { Player } from '../domain/player';
import type { LeagueSettings, RosterSlot } from '../domain/roster';
import { computeReplacementLevels } from './replacementLevel';
import { computeAdpDelta, computeValue, labelAdpDelta } from './value';
import { computeNeedScore } from './need';
import type { Recommendation } from './types';

export const DEFAULT_BPA_VS_NEED_WEIGHT = 0.3;

function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function buildReasonParts(
  player: Player,
  value: number,
  adpDelta: number,
  needScore: number,
): string[] {
  const parts: string[] = [];
  const primaryPosition = player.position[0];

  parts.push(
    `${value >= 0 ? '+' : ''}${value.toFixed(1)} pts over replacement at ${primaryPosition}`,
  );

  const label = labelAdpDelta(adpDelta);
  if (label === 'steal') {
    parts.push(`Ranked ${player.rank}, going ADP ~${player.adp} — steal`);
  } else if (label === 'reach') {
    parts.push(`Ranked ${player.rank}, going ADP ~${player.adp} — reach`);
  }

  if (needScore === 1.0) {
    parts.push(`Fills an open ${primaryPosition} slot`);
  } else if (needScore === 0.5) {
    parts.push(`Could fill your open FLEX slot`);
  }

  return parts;
}

/**
 * Pure function: ranks available players by a weighted blend of VBD value and roster need.
 * w = 0 is pure best-player-available; w = 1 is pure fill-need.
 */
export function rankRecommendations(
  availablePlayers: Player[],
  leagueSettings: LeagueSettings,
  rosterSlots: RosterSlot[],
  weight: number = DEFAULT_BPA_VS_NEED_WEIGHT,
  topN = 10,
): Recommendation[] {
  if (availablePlayers.length === 0) return [];

  const replacementLevels = computeReplacementLevels(availablePlayers, leagueSettings);

  const raw = availablePlayers.map((player) => ({
    player,
    value: computeValue(player, replacementLevels),
    adpDelta: computeAdpDelta(player),
    needScore: computeNeedScore(player, rosterSlots),
  }));

  const normalizedValues = minMaxNormalize(raw.map((r) => r.value));
  const normalizedNeeds = minMaxNormalize(raw.map((r) => r.needScore));

  const recommendations: Recommendation[] = raw.map((r, i) => ({
    player: r.player,
    value: r.value,
    adpDelta: r.adpDelta,
    needScore: r.needScore,
    score: (1 - weight) * normalizedValues[i] + weight * normalizedNeeds[i],
    reasonParts: buildReasonParts(r.player, r.value, r.adpDelta, r.needScore),
  }));

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, topN);
}
