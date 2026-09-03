import type { RosterSlot } from '../../domain/roster';

export function RosterNeedsView({ rosterSlots }: { rosterSlots: RosterSlot[] }) {
  return (
    <section className="roster-needs">
      <h2>Your Roster</h2>
      <div className="roster-needs__pills">
        {rosterSlots.map((slot) => (
          <span
            key={slot.position}
            className={`roster-pill ${slot.filled >= slot.count ? 'roster-pill--full' : 'roster-pill--open'}`}
          >
            {slot.position} {slot.filled}/{slot.count}
          </span>
        ))}
      </div>
    </section>
  );
}
