import { describe, expect, it } from 'vitest';
import { computeFilledRosterSlots, createDefaultLeagueSettings } from './roster';
import { makePlayer } from '../test/fixtures';

describe('computeFilledRosterSlots', () => {
  it('fills exact-position slots first', () => {
    const template = createDefaultLeagueSettings(10).rosterSlots;
    const roster = [makePlayer({ id: 'RB1', position: ['RB'] })];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'RB')?.filled).toBe(1);
    expect(slots.find((s) => s.position === 'FLEX')?.filled).toBe(0);
  });

  it('overflows a FLEX-eligible position into FLEX once exact slots are full', () => {
    const template = createDefaultLeagueSettings(10).rosterSlots; // RB count: 2
    const roster = [
      makePlayer({ id: 'RB1', position: ['RB'] }),
      makePlayer({ id: 'RB2', position: ['RB'] }),
      makePlayer({ id: 'RB3', position: ['RB'] }),
    ];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'RB')?.filled).toBe(2);
    expect(slots.find((s) => s.position === 'FLEX')?.filled).toBe(1);
  });

  it('overflows into BENCH once exact and FLEX slots are full', () => {
    const template = createDefaultLeagueSettings(10).rosterSlots; // RB:2, FLEX:1
    const roster = [
      makePlayer({ id: 'RB1', position: ['RB'] }),
      makePlayer({ id: 'RB2', position: ['RB'] }),
      makePlayer({ id: 'RB3', position: ['RB'] }),
      makePlayer({ id: 'RB4', position: ['RB'] }),
    ];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'RB')?.filled).toBe(2);
    expect(slots.find((s) => s.position === 'FLEX')?.filled).toBe(1);
    expect(slots.find((s) => s.position === 'BENCH')?.filled).toBe(1);
  });

  it('does not assign a non-FLEX-eligible position (K) into FLEX', () => {
    const template = createDefaultLeagueSettings(10).rosterSlots; // K:1
    const roster = [
      makePlayer({ id: 'K1', position: ['K'] }),
      makePlayer({ id: 'K2', position: ['K'] }),
    ];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'K')?.filled).toBe(1);
    expect(slots.find((s) => s.position === 'FLEX')?.filled).toBe(0);
    expect(slots.find((s) => s.position === 'BENCH')?.filled).toBe(1);
  });

  it('overflows a QB into SUPERFLEX once the exact QB slot is full', () => {
    const template = [
      { position: 'QB' as const, count: 1, filled: 0 },
      { position: 'SUPERFLEX' as const, count: 1, filled: 0 },
      { position: 'BENCH' as const, count: 2, filled: 0 },
    ];
    const roster = [
      makePlayer({ id: 'QB1', position: ['QB'] }),
      makePlayer({ id: 'QB2', position: ['QB'] }),
    ];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'QB')?.filled).toBe(1);
    expect(slots.find((s) => s.position === 'SUPERFLEX')?.filled).toBe(1);
  });

  it('overflows an IDP position (DL) into IDP_FLEX once its exact slot is full', () => {
    const template = [
      { position: 'DL' as const, count: 1, filled: 0 },
      { position: 'IDP_FLEX' as const, count: 1, filled: 0 },
      { position: 'BENCH' as const, count: 2, filled: 0 },
    ];
    const roster = [
      makePlayer({ id: 'DL1', position: ['DL'] }),
      makePlayer({ id: 'DL2', position: ['DL'] }),
    ];
    const slots = computeFilledRosterSlots(template, roster);
    expect(slots.find((s) => s.position === 'DL')?.filled).toBe(1);
    expect(slots.find((s) => s.position === 'IDP_FLEX')?.filled).toBe(1);
  });
});
