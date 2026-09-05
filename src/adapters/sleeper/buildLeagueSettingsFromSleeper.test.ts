import { describe, expect, it } from 'vitest';
import {
  UnsupportedDraftTypeError,
  ViewerNotInDraftError,
  buildLeagueSettingsFromSleeper,
} from './buildLeagueSettingsFromSleeper';
import type { SleeperDraft, SleeperLeagueRoster, SleeperLeagueUser } from './sleeperTypes';

// Based on Sleeper's own documented example response for GET /v1/draft/<draft_id>.
function sampleDraft(overrides: Partial<SleeperDraft> = {}): SleeperDraft {
  return {
    draft_id: '257270643320426496',
    league_id: '257270637750382592',
    type: 'snake',
    status: 'complete',
    season: '2017',
    settings: {
      teams: 3,
      rounds: 15,
      slots_qb: 1,
      slots_rb: 2,
      slots_wr: 2,
      slots_te: 1,
      slots_flex: 2,
      slots_def: 1,
      slots_k: 1,
      slots_bn: 5,
    },
    draft_order: { user_a: 1, user_b: 2, user_c: 3 },
    slot_to_roster_id: { '1': 10, '2': 3, '3': 5 },
    ...overrides,
  };
}

const leagueUsers: SleeperLeagueUser[] = [
  { user_id: 'user_a', display_name: 'Alice' },
  { user_id: 'user_b', display_name: 'Bob' },
  { user_id: 'user_c', display_name: 'Cara' },
];

const leagueRosters: SleeperLeagueRoster[] = [
  { roster_id: 10, owner_id: 'user_a' },
  { roster_id: 3, owner_id: 'user_b' },
  { roster_id: 5, owner_id: 'user_c' },
];

describe('buildLeagueSettingsFromSleeper', () => {
  it('maps roster slot settings, dropping zero-count slots', () => {
    const { leagueSettings } = buildLeagueSettingsFromSleeper(sampleDraft(), leagueUsers, leagueRosters, 'user_a');

    expect(leagueSettings.teamCount).toBe(3);
    expect(leagueSettings.draftType).toBe('snake');
    expect(leagueSettings.platform).toBe('sleeper');
    expect(leagueSettings.rosterSlots).toEqual([
      { position: 'QB', count: 1, filled: 0 },
      { position: 'RB', count: 2, filled: 0 },
      { position: 'WR', count: 2, filled: 0 },
      { position: 'TE', count: 1, filled: 0 },
      { position: 'FLEX', count: 2, filled: 0 },
      { position: 'K', count: 1, filled: 0 },
      { position: 'DST', count: 1, filled: 0 },
      { position: 'BENCH', count: 5, filled: 0 },
    ]);
  });

  it('maps Superflex and IDP roster slots instead of dropping them', () => {
    const { leagueSettings } = buildLeagueSettingsFromSleeper(
      sampleDraft({
        settings: {
          teams: 3,
          rounds: 15,
          slots_qb: 1,
          slots_flex: 1,
          slots_super_flex: 1,
          slots_dl: 2,
          slots_lb: 2,
          slots_db: 2,
          slots_idp_flex: 1,
          slots_bn: 5,
        },
      }),
      leagueUsers,
      leagueRosters,
      'user_a',
    );

    expect(leagueSettings.rosterSlots).toEqual(
      expect.arrayContaining([
        { position: 'SUPERFLEX', count: 1, filled: 0 },
        { position: 'DL', count: 2, filled: 0 },
        { position: 'LB', count: 2, filled: 0 },
        { position: 'DB', count: 2, filled: 0 },
        { position: 'IDP_FLEX', count: 1, filled: 0 },
      ]),
    );
  });

  it('builds draftOrder from draft_order + slot_to_roster_id, in slot order', () => {
    const { leagueSettings } = buildLeagueSettingsFromSleeper(sampleDraft(), leagueUsers, leagueRosters, 'user_a');
    // slot 1 -> roster 10 (Alice), slot 2 -> roster 3 (Bob), slot 3 -> roster 5 (Cara).
    expect(leagueSettings.draftOrder).toEqual([
      'sleeper-roster-10',
      'sleeper-roster-3',
      'sleeper-roster-5',
    ]);
  });

  it('resolves the viewer to their roster id and labels it "Me"', () => {
    const { leagueSettings, userTeamId } = buildLeagueSettingsFromSleeper(
      sampleDraft(),
      leagueUsers,
      leagueRosters,
      'user_b',
    );
    expect(userTeamId).toBe('sleeper-roster-3');
    expect(leagueSettings.teamNames['sleeper-roster-3']).toBe('Me');
    expect(leagueSettings.teamNames['sleeper-roster-10']).toBe('Alice');
    expect(leagueSettings.teamNames['sleeper-roster-5']).toBe('Cara');
  });

  it('throws ViewerNotInDraftError when the username is not one of the drafters', () => {
    expect(() =>
      buildLeagueSettingsFromSleeper(sampleDraft(), leagueUsers, leagueRosters, 'not_in_this_draft'),
    ).toThrow(ViewerNotInDraftError);
  });

  it('throws UnsupportedDraftTypeError for auction drafts', () => {
    expect(() =>
      buildLeagueSettingsFromSleeper(sampleDraft({ type: 'auction' }), leagueUsers, leagueRosters, 'user_a'),
    ).toThrow(UnsupportedDraftTypeError);
  });

  it('falls back to a generic team name when a roster has no matching league user', () => {
    const { leagueSettings } = buildLeagueSettingsFromSleeper(
      sampleDraft(),
      [],
      [
        { roster_id: 10, owner_id: 'user_a' },
        { roster_id: 3, owner_id: null },
        { roster_id: 5, owner_id: null },
      ],
      'user_a',
    );
    expect(leagueSettings.teamNames['sleeper-roster-3']).toBe('Team 3');
  });

  it('resolves the viewer via roster ownership even when the draft has not started (draft_order is null)', () => {
    const { leagueSettings, userTeamId } = buildLeagueSettingsFromSleeper(
      sampleDraft({ draft_order: null, status: 'pre_draft' }),
      leagueUsers,
      leagueRosters,
      'user_b',
    );
    expect(userTeamId).toBe('sleeper-roster-3');
    expect(leagueSettings.teamNames['sleeper-roster-3']).toBe('Me');
  });
});
