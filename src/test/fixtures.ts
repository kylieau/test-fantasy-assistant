import type { Player } from '../domain/player';
import { createDefaultLeagueSettings } from '../domain/roster';

export function makePlayer(overrides: Partial<Player> & Pick<Player, 'id'>): Player {
  return {
    name: overrides.id,
    position: ['RB'],
    team: 'AAA',
    sport: 'NFL',
    adp: 1,
    rank: 1,
    projected_points: 100,
    ...overrides,
  };
}

/** Small fixed pool: enough depth per position to exercise replacement-level math by hand. */
export function samplePlayers(): Player[] {
  const qb = [220, 210, 200, 190, 180, 170].map((pts, i) =>
    makePlayer({ id: `QB${i + 1}`, position: ['QB'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  const rb = [280, 260, 240, 220, 200, 180, 160, 140, 120, 100].map((pts, i) =>
    makePlayer({ id: `RB${i + 1}`, position: ['RB'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  const wr = [270, 250, 230, 210, 190, 170, 150, 130, 110, 90].map((pts, i) =>
    makePlayer({ id: `WR${i + 1}`, position: ['WR'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  const te = [180, 150, 120, 90].map((pts, i) =>
    makePlayer({ id: `TE${i + 1}`, position: ['TE'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  const k = [140, 130, 120].map((pts, i) =>
    makePlayer({ id: `K${i + 1}`, position: ['K'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  const dst = [130, 120, 110].map((pts, i) =>
    makePlayer({ id: `DST${i + 1}`, position: ['DST'], projected_points: pts, adp: i + 1, rank: i + 1 }),
  );
  return [...qb, ...rb, ...wr, ...te, ...k, ...dst];
}

export const sampleLeagueSettings = () => createDefaultLeagueSettings(4);
