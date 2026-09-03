import type { Player } from '../../domain/player';
import { groupRosterBySlot, type RosterSlot } from '../../domain/roster';
import { POSITION_COLORS } from '../positionColors';

export function TeamRosterCard({
  title,
  rosterSlots,
  roster,
}: {
  title: string;
  rosterSlots: RosterSlot[];
  roster: Player[];
}) {
  const grouped = groupRosterBySlot(rosterSlots, roster);

  return (
    <section className="team-roster-card">
      <h2>{title}</h2>
      <ul className="team-roster-card__list">
        {grouped.map((slot) => (
          <li key={slot.position} className="team-roster-card__slot">
            <span className="team-roster-card__slot-label">{slot.position}</span>
            {slot.players.length > 0 ? (
              <ul className="team-roster-card__players">
                {slot.players.map((player) => (
                  <li key={player.id}>
                    <span
                      className="position-badge"
                      style={{ backgroundColor: POSITION_COLORS[player.position[0]] }}
                    >
                      {player.position[0]}
                    </span>
                    {player.name}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="team-roster-card__empty">{slot.count - slot.filled} open</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
