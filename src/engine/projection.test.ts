import { describe, expect, it } from 'vitest';
import { availabilityMargin, projectFuturePicks, upcomingUserPickNumbers } from './projection';
import { createDefaultLeagueSettings } from '../domain/roster';
import { makePlayer } from '../test/fixtures';
import type { LeagueSettings } from '../domain/roster';

function twoTeamSnakeSettings(): LeagueSettings {
  return {
    ...createDefaultLeagueSettings(2),
    draftType: 'snake',
    draftOrder: ['user', 'opp-1'],
    teamNames: { user: 'Me', 'opp-1': 'Rival' },
  };
}

function twoTeamLinearSettings(): LeagueSettings {
  return { ...twoTeamSnakeSettings(), draftType: 'linear' };
}

describe('upcomingUserPickNumbers', () => {
  it('finds the next N snake-order picks belonging to the user', () => {
    // 2-team snake: 1=user, 2=opp, 3=opp, 4=user, 5=user, 6=opp, 7=opp, 8=user...
    expect(upcomingUserPickNumbers(twoTeamSnakeSettings(), 1, 'user', 3)).toEqual([1, 4, 5]);
  });

  it('finds the next N linear-order picks belonging to the user', () => {
    // 2-team linear: 1=user, 2=opp, 3=user, 4=opp, ...
    expect(upcomingUserPickNumbers(twoTeamLinearSettings(), 1, 'user', 3)).toEqual([1, 3, 5]);
  });

  it('starts searching from currentPick, not pick 1', () => {
    expect(upcomingUserPickNumbers(twoTeamSnakeSettings(), 2, 'user', 2)).toEqual([4, 5]);
  });
});

describe('availabilityMargin', () => {
  it('is positive when ADP is later than the target pick (likely still there)', () => {
    const player = makePlayer({ id: 'p1', adp: 20 });
    expect(availabilityMargin(player, 10)).toBe(10);
  });

  it('is negative when ADP is earlier than the target pick (likely gone)', () => {
    const player = makePlayer({ id: 'p1', adp: 5 });
    expect(availabilityMargin(player, 10)).toBe(-5);
  });
});

describe('projectFuturePicks', () => {
  it('simulates opponents drafting by best ADP between the user\'s turns', () => {
    const settings = twoTeamSnakeSettings();
    // Single position, single-file ADP/points ordering so both "best ADP" and "best value"
    // point at the same player each time — keeps the simulation unambiguous to hand-verify.
    const players = [300, 290, 280, 270, 260].map((pts, i) =>
      makePlayer({ id: `RB${i + 1}`, position: ['RB'], adp: i + 1, rank: i + 1, projected_points: pts }),
    );

    // Picks: 1=user, 2=opp-1, 3=opp-1, 4=user (snake reverses round 2 for 2 teams).
    const projections = projectFuturePicks(players, settings, [], 'bpa', 1, 'user', 2);

    expect(projections.map((p) => p.pickNumber)).toEqual([1, 4]);
    expect(projections[0].player.id).toBe('RB1'); // user's immediate pick: best available now
    expect(projections[0].round).toBe(1);
    // Opponent is simulated taking RB2 (pick 2) then RB3 (pick 3) by best ADP in between.
    expect(projections[1].player.id).toBe('RB4');
    expect(projections[1].round).toBe(2);
  });

  it('returns an empty array when the user has no upcoming picks in range', () => {
    const settings = twoTeamSnakeSettings();
    expect(projectFuturePicks([], settings, [], 'bpa', 1, 'user', 0)).toEqual([]);
  });
});
