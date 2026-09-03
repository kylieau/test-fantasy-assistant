import { useState, type FormEvent } from 'react';
import { createDefaultLeagueSettings, type RosterSlot } from '../../domain/roster';
import { useDraft } from '../../state/DraftContext';

export function LeagueSetupForm() {
  const { startNewDraft } = useDraft();
  const [teamCount, setTeamCount] = useState(10);
  const [rosterSlots, setRosterSlots] = useState<RosterSlot[]>(
    () => createDefaultLeagueSettings(10).rosterSlots,
  );

  function updateSlotCount(position: RosterSlot['position'], count: number) {
    setRosterSlots((slots) =>
      slots.map((slot) => (slot.position === position ? { ...slot, count: Math.max(0, count) } : slot)),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startNewDraft({ teamCount, rosterSlots, scoring: { type: 'points' } });
  }

  return (
    <form className="league-setup" onSubmit={handleSubmit}>
      <h2>Set up your league</h2>

      <label className="field">
        <span>Number of teams</span>
        <input
          type="number"
          min={2}
          max={20}
          value={teamCount}
          onChange={(e) => setTeamCount(Number(e.target.value))}
        />
      </label>

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

      <button type="submit" className="primary-button">
        Start Draft
      </button>
    </form>
  );
}
