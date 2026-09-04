import { useState, type FormEvent } from 'react';
import { createDefaultLeagueSettings, type DraftType, type RosterSlot } from '../../domain/roster';
import { USER_TEAM_ID } from '../../domain/draft';
import {
  ALL_STRATEGIES,
  STRATEGY_DESCRIPTIONS,
  STRATEGY_LABELS,
  type DraftStrategy,
} from '../../domain/strategy';
import { useDraft } from '../../state/DraftContext';
import { ConnectSleeperForm } from './ConnectSleeperForm';

type SetupPlatform = 'manual' | 'sleeper';

const DEFAULT_TEAM_COUNT = 10;

function defaultTeamNames(teamCount: number, userPosition: number): string[] {
  return Array.from({ length: teamCount }, (_, i) => (i + 1 === userPosition ? 'Me' : `Team ${i + 1}`));
}

export function LeagueSetupForm() {
  const { startNewDraft } = useDraft();
  const [platform, setPlatform] = useState<SetupPlatform>('manual');
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [draftType, setDraftType] = useState<DraftType>('snake');
  const [userPosition, setUserPosition] = useState(1);
  const [teamNames, setTeamNames] = useState<string[]>(() => defaultTeamNames(DEFAULT_TEAM_COUNT, 1));
  const [rosterSlots, setRosterSlots] = useState<RosterSlot[]>(
    () => createDefaultLeagueSettings(DEFAULT_TEAM_COUNT).rosterSlots,
  );
  const [strategy, setStrategy] = useState<DraftStrategy>('balanced');

  function updateTeamCount(count: number) {
    const clamped = Math.max(2, Math.min(20, count));
    setTeamCount(clamped);
    setUserPosition((pos) => Math.min(pos, clamped));
    setTeamNames((names) => {
      const next = names.slice(0, clamped);
      while (next.length < clamped) {
        next.push(`Team ${next.length + 1}`);
      }
      return next;
    });
  }

  function updateSlotCount(position: RosterSlot['position'], count: number) {
    setRosterSlots((slots) =>
      slots.map((slot) => (slot.position === position ? { ...slot, count: Math.max(0, count) } : slot)),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let oppCounter = 0;
    const draftOrder = Array.from({ length: teamCount }, (_, i) =>
      i + 1 === userPosition ? USER_TEAM_ID : `opp-${++oppCounter}`,
    );
    const teamNamesById = Object.fromEntries(
      draftOrder.map((id, i) => [id, teamNames[i]?.trim() || `Team ${i + 1}`]),
    );

    startNewDraft(
      {
        teamCount,
        rosterSlots,
        scoring: { type: 'points' },
        draftType,
        draftOrder,
        teamNames: teamNamesById,
        platform: 'manual',
        hasProjections: true,
      },
      strategy,
    );
  }

  const platformToggle = (
    <div className="platform-toggle">
      <button
        type="button"
        className={`app-tab ${platform === 'manual' ? 'app-tab--active' : ''}`}
        onClick={() => setPlatform('manual')}
      >
        Manual Entry
      </button>
      <button
        type="button"
        className={`app-tab ${platform === 'sleeper' ? 'app-tab--active' : ''}`}
        onClick={() => setPlatform('sleeper')}
      >
        Connect to Sleeper
      </button>
    </div>
  );

  if (platform === 'sleeper') {
    return (
      <div className="league-setup">
        {platformToggle}
        <ConnectSleeperForm />
      </div>
    );
  }

  return (
    <form className="league-setup" onSubmit={handleSubmit}>
      {platformToggle}
      <h2>League Rules &amp; Personal Strategy</h2>

      <label className="field">
        <span>Number of teams</span>
        <input
          type="number"
          min={2}
          max={20}
          value={teamCount}
          onChange={(e) => updateTeamCount(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span>Type of draft</span>
        <select value={draftType} onChange={(e) => setDraftType(e.target.value as DraftType)}>
          <option value="snake">Snake</option>
          <option value="linear">Linear (same order every round)</option>
        </select>
      </label>

      <label className="field">
        <span>Your draft position</span>
        <select value={userPosition} onChange={(e) => setUserPosition(Number(e.target.value))}>
          {Array.from({ length: teamCount }, (_, i) => i + 1).map((pos) => (
            <option key={pos} value={pos}>
              Pick {pos}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="team-names">
        <legend>Draft order &amp; team names</legend>
        {teamNames.map((name, i) => (
          <label key={i} className="field field--compact">
            <span>
              Pick {i + 1}
              {i + 1 === userPosition ? ' (You)' : ''}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const value = e.target.value;
                setTeamNames((names) => names.map((n, idx) => (idx === i ? value : n)));
              }}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="roster-slots">
        <legend>Roster slots</legend>
        {rosterSlots.map((slot) => (
          <label key={slot.position} className="field field--compact">
            <span>{slot.position}</span>
            <input
              type="number"
              min={0}
              max={15}
              value={slot.count}
              onChange={(e) => updateSlotCount(slot.position, Number(e.target.value))}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="strategy-picker">
        <legend>Your draft strategy</legend>
        {ALL_STRATEGIES.map((s) => (
          <label key={s} className="strategy-option">
            <input
              type="radio"
              name="strategy"
              value={s}
              checked={strategy === s}
              onChange={() => setStrategy(s)}
            />
            <span>
              <strong>{STRATEGY_LABELS[s]}</strong>
              <small>{STRATEGY_DESCRIPTIONS[s]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className="primary-button">
        Start Draft
      </button>
    </form>
  );
}
