import { describe, expect, it } from 'vitest';
import { analyzeRoster, summarizeRoster } from './rosterAnalysis';
import { sampleLeagueSettings, samplePlayers, makePlayer } from '../test/fixtures';
import { computeFilledRosterSlots } from '../domain/roster';
import type { LeagueSettings } from '../domain/roster';

describe('analyzeRoster', () => {
  it('sums projected points and per-position VBD value for the roster', () => {
    const availablePlayers = samplePlayers();
    const roster = [
      availablePlayers.find((p) => p.id === 'RB1')!,
      availablePlayers.find((p) => p.id === 'RB2')!,
      availablePlayers.find((p) => p.id === 'WR1')!,
    ];

    const analysis = analyzeRoster(roster, availablePlayers, sampleLeagueSettings());

    expect(analysis.totalProjectedPoints).toBeCloseTo(280 + 260 + 270);
    expect(analysis.positionSummaries.map((s) => s.position).sort()).toEqual(['RB', 'WR']);

    const rbSummary = analysis.positionSummaries.find((s) => s.position === 'RB')!;
    expect(rbSummary.count).toBe(2);
    expect(rbSummary.totalProjectedPoints).toBeCloseTo(280 + 260);
  });

  it('groups players sharing a bye week as a conflict, ignoring singletons', () => {
    const availablePlayers = samplePlayers();
    const roster = [
      makePlayer({ id: 'a', position: ['RB'], bye_week: 7 }),
      makePlayer({ id: 'b', position: ['WR'], bye_week: 7 }),
      makePlayer({ id: 'c', position: ['TE'], bye_week: 9 }),
    ];

    const analysis = analyzeRoster(roster, availablePlayers, sampleLeagueSettings());

    expect(analysis.byeWeekConflicts).toHaveLength(1);
    expect(analysis.byeWeekConflicts[0].week).toBe(7);
    expect(analysis.byeWeekConflicts[0].players.map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  it('returns empty summaries for an empty roster', () => {
    const analysis = analyzeRoster([], samplePlayers(), sampleLeagueSettings());
    expect(analysis.totalProjectedPoints).toBe(0);
    expect(analysis.totalValue).toBe(0);
    expect(analysis.positionSummaries).toEqual([]);
    expect(analysis.byeWeekConflicts).toEqual([]);
  });
});

describe('summarizeRoster', () => {
  it('says nothing has been drafted yet for an empty roster', () => {
    const leagueSettings = sampleLeagueSettings();
    const analysis = analyzeRoster([], samplePlayers(), leagueSettings);
    const filledSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, []);

    const summary = summarizeRoster(analysis, filledSlots, samplePlayers(), leagueSettings);
    expect(summary).toBe('No players drafted yet — your team analysis will appear here once you make your first pick.');
  });

  it('names the strongest position and the best remaining player at open positions', () => {
    const leagueSettings = sampleLeagueSettings();
    const fullPool = samplePlayers();
    const roster = [fullPool.find((p) => p.id === 'RB1')!, fullPool.find((p) => p.id === 'RB2')!];
    const availablePlayers = fullPool.filter((p) => p.id !== 'RB1' && p.id !== 'RB2');
    const filledSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, roster);
    const analysis = analyzeRoster(roster, availablePlayers, leagueSettings);

    const summary = summarizeRoster(analysis, filledSlots, availablePlayers, leagueSettings);

    expect(summary).toContain('RB'); // the only position drafted, so necessarily the "strength"
    // RB's 2 starter slots are full, so QB and WR (the next two open positions in order) are named.
    expect(summary).toContain('QB1'); // best remaining QB
    expect(summary).toContain('WR1'); // best remaining WR
    expect(summary).toMatch(/\d+ of \d+ roster spots filled/);
  });

  it('notes when every starting position is filled', () => {
    const leagueSettings: LeagueSettings = {
      ...sampleLeagueSettings(),
      rosterSlots: [
        { position: 'QB', count: 1, filled: 0 },
        { position: 'RB', count: 1, filled: 0 },
      ],
    };
    const fullPool = samplePlayers();
    const roster = [fullPool.find((p) => p.id === 'QB1')!, fullPool.find((p) => p.id === 'RB1')!];
    const availablePlayers = fullPool.filter((p) => p.id !== 'QB1' && p.id !== 'RB1');
    const filledSlots = computeFilledRosterSlots(leagueSettings.rosterSlots, roster);
    const analysis = analyzeRoster(roster, availablePlayers, leagueSettings);

    const summary = summarizeRoster(analysis, filledSlots, availablePlayers, leagueSettings);

    expect(summary).toContain('purely about depth');
    expect(summary).toContain('0 picks left');
  });
});
