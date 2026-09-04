import { describe, expect, it } from 'vitest';
import { mapSleeperPickMetadata, mapSleeperPlayer } from './mapSleeperPlayer';
import type { SleeperPlayer } from './sleeperTypes';

describe('mapSleeperPlayer', () => {
  it('maps a standard skill-position player with sentinel projections', () => {
    const raw: SleeperPlayer = {
      player_id: '4046',
      full_name: 'Josh Allen',
      position: 'QB',
      fantasy_positions: ['QB'],
      team: 'BUF',
    };

    const player = mapSleeperPlayer(raw);

    expect(player).toEqual({
      id: '4046',
      name: 'Josh Allen',
      position: ['QB'],
      team: 'BUF',
      sport: 'NFL',
      adp: 0,
      rank: 0,
      projected_points: 0,
    });
  });

  it('maps Sleeper\'s DEF position to our DST', () => {
    const raw: SleeperPlayer = {
      player_id: 'HOU',
      full_name: 'Houston Texans',
      position: 'DEF',
      fantasy_positions: ['DEF'],
      team: 'HOU',
    };

    expect(mapSleeperPlayer(raw)?.position).toEqual(['DST']);
  });

  it('falls back to first/last name, then team, then id when full_name is missing', () => {
    const noFullName: SleeperPlayer = {
      player_id: '123',
      first_name: 'Joe',
      last_name: 'Flacco',
      position: 'QB',
      fantasy_positions: ['QB'],
      team: 'CIN',
    };
    expect(mapSleeperPlayer(noFullName)?.name).toBe('Joe Flacco');

    const teamOnly: SleeperPlayer = { player_id: 'NE', position: 'DEF', fantasy_positions: ['DEF'], team: 'NE' };
    expect(mapSleeperPlayer(teamOnly)?.name).toBe('NE');
  });

  it('returns null for unsupported positions (IDP etc.)', () => {
    const idp: SleeperPlayer = {
      player_id: '999',
      full_name: 'Some Linebacker',
      position: 'LB',
      fantasy_positions: ['LB'],
      team: 'SF',
    };
    expect(mapSleeperPlayer(idp)).toBeNull();
  });

  it('defaults team to FA when missing', () => {
    const freeAgent: SleeperPlayer = {
      player_id: '555',
      full_name: 'Free Agent Guy',
      position: 'WR',
      fantasy_positions: ['WR'],
      team: null,
    };
    expect(mapSleeperPlayer(freeAgent)?.team).toBe('FA');
  });
});

describe('mapSleeperPickMetadata', () => {
  it('maps pick metadata as a fallback when the cached player lookup misses', () => {
    const player = mapSleeperPickMetadata('4046', {
      first_name: 'Josh',
      last_name: 'Allen',
      position: 'QB',
      team: 'BUF',
    });

    expect(player).toEqual({
      id: '4046',
      name: 'Josh Allen',
      position: ['QB'],
      team: 'BUF',
      sport: 'NFL',
      adp: 0,
      rank: 0,
      projected_points: 0,
    });
  });

  it('returns null when metadata is missing entirely', () => {
    expect(mapSleeperPickMetadata('4046', null)).toBeNull();
  });

  it('returns null for an unsupported position in metadata', () => {
    expect(mapSleeperPickMetadata('1', { position: 'DL', first_name: 'A', last_name: 'B' })).toBeNull();
  });
});
